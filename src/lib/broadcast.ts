import {
  attach,
  createEffect,
  createEvent,
  createStore,
  Event,
  sample,
  scopeBind,
} from "effector";
import { readonly } from "patronum/readonly";
import { spread } from "patronum/spread";
type BroadcastConfig<P> = {
  channelName: string;
  event: Event<P>;
  setup: Event<unknown>;
  teardown?: Event<unknown>;
  parse: (messagePayload: unknown) => P;
};

export const createBroadcast = <P>(config: BroadcastConfig<P>) => {
  const $channel = createStore<BroadcastChannel | null>(null, {
    serialize: "ignore",
  });

  const received = createEvent<P>();
  const sendDone = createEvent<P>();
  const sendFailed = createEvent<{ payload: P; error: Error }>();

  const $unsubscribe = createStore(() => {});

  const subscribeChannelFx = attach({
    source: $unsubscribe,
    effect: (unsubscribe, channel: BroadcastChannel) => {
      unsubscribe();
      const abortController = new AbortController();

      channel.addEventListener(
        "message",
        scopeBind((e) => {
          const payload = config.parse(e.data);
          received(payload);
        }),
        { signal: abortController.signal }
      );

      return () => abortController.abort();
    },
  });
  const unsubscribeChannelFx = attach({
    source: $unsubscribe,
    effect: (unsubscribe) => {
      unsubscribe();
    },
  });
  const openChannelFx = attach({
    source: $channel,
    effect: (channel, name: string) => {
      channel?.close();
      return new BroadcastChannel(name);
    },
  });
  const closeChannelFx = attach({
    source: $channel,
    effect: (channel) => {
      channel?.close();
    },
  });

  const setupChannelFx = createEffect(async (name: string) => {
    const channel = await openChannelFx(name);
    const subscription = await subscribeChannelFx(channel);

    return { subscription, channel };
  });
  const teardownChannelFx = createEffect(async () => {
    await unsubscribeChannelFx();
    await closeChannelFx();
  });
  const sendMessageFx = createEffect(
    async ({ channel, payload }: { channel: BroadcastChannel; payload: P }) => {
      try {
        channel.postMessage(payload);
      } catch (error) {
        console.error(
          `Failed to send message through "${config.channelName}" BroadcastChannel`,
          error
        );
        throw error;
      }
    }
  );

  sample({
    clock: config.setup,
    fn: () => config.channelName,
    target: setupChannelFx,
  });
  if (config.teardown) {
    sample({
      clock: config.teardown,
      target: teardownChannelFx,
    });
  }
  sample({
    clock: setupChannelFx.doneData,
    fn: ({ channel, subscription }) => ({
      $channel: channel,
      $unsubscribe: subscription,
    }),
    target: spread({
      $channel,
      $unsubscribe,
    }),
  });
  sample({
    clock: config.event,
    source: $channel,
    filter: Boolean,
    fn: (channel, payload) => ({ channel, payload }),
    target: sendMessageFx,
  });
  sample({
    clock: sendMessageFx.done,
    fn: ({ params }) => params.payload,
    target: sendDone,
  });
  sample({
    clock: sendMessageFx.fail,
    fn: ({ error, params }) => ({ payload: params.payload, error }),
    target: sendFailed,
  });

  return {
    sendDone,
    sendFailed,
    received,
    __: {
      $channel,
      $unsubscribe,
    },
  };
};

export const broadcast = <P>(config: BroadcastConfig<P>) => {
  const api = createBroadcast(config);
  return {
    done: readonly(api.sendDone),
    failed: readonly(api.sendFailed),
    received: readonly(api.received),
  };
};

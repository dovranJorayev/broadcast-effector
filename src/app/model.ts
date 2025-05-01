import { broadcast } from "@lib/broadcast";
import { trackPageVisibility } from "@withease/web-api";
import { createEvent, createStore, sample } from "effector";
import { and } from "patronum/and";
import { debounce } from "patronum/debounce";
import { debug } from "patronum/debug";

const setup = createEvent();
const teardown = createEvent();
const notify = createEvent();
const openPopup = createEvent();
const dismissPopup = createEvent();

const visibilityApi = trackPageVisibility({
  setup,
  teardown,
});

const broadcastApi = broadcast({
  channelName: "app-channel",
  event: notify,
  setup,
  teardown,
  parse: (payload) => payload,
});

const $isActive = createStore(false);
const $isPopupOpen = createStore(false);
const $isPopupAllowed = and($isActive, visibilityApi.$visible);

// page activation flow
sample({
  clock: debounce(setup, 0),
  fn: () => true,
  target: $isActive,
});
sample({
  clock: debounce(teardown, 0),
  fn: () => false,
  target: $isActive,
});
// open/close flow
sample({
  clock: openPopup,
  fn: () => true,
  target: $isPopupOpen,
});
sample({
  clock: dismissPopup,
  fn: () => false,
  target: $isPopupOpen,
});

sample({
  clock: [notify, broadcastApi.received],
  // filter: $isPopupAllowed,
  target: openPopup,
});

debug(
  // Broadcast events
  broadcastApi.received,
  broadcastApi.done,
  broadcastApi.failed
);

export const model = {
  $isPopupOpen,
  commands: {
    setup,
    teardown,
    notify,
    dismissPopup,
  },
};

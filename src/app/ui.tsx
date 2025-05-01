import { useUnit } from "effector-react";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "../components/ui/dialog";
import { model } from "./model";

export const App = () => {
  const commands = useUnit(model.commands);

  const isOpen = useUnit(model.$isPopupOpen);

  const onOpenChange = (open: boolean) => {
    if (!open) commands.dismissPopup();
  };

  const onNotifyClick = () => commands.notify();

  useEffect(() => {
    commands.setup();
    return () => {
      commands.teardown();
    };
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      <Button onClick={onNotifyClick}>Notify</Button>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>Notification</DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

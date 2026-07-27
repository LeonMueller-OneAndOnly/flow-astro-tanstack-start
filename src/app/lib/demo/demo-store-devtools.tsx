import { EventClient } from "@tanstack/devtools-event-client";
import { useState, useEffect } from "react";

import { demoStore } from "./demo-store";

type EventMap = {
  "store-devtools:state": {
    firstName: string;
    lastName: string;
  };
};

class StoreDevtoolsEventClient extends EventClient<EventMap> {
  constructor() {
    super({
      pluginId: "store-devtools",
    });
  }
}

const sdec = new StoreDevtoolsEventClient();

demoStore.subscribe(() => {
  sdec.emit("store-devtools:state", {
    firstName: demoStore.state.firstName,
    lastName: demoStore.state.lastName,
  });
});

function DevtoolPanel() {
  const [state, setState] = useState<EventMap["store-devtools:state"]>(() => ({
    firstName: demoStore.state.firstName,
    lastName: demoStore.state.lastName,
  }));

  useEffect(() => {
    return sdec.on("store-devtools:state", (e) => setState(e.payload));
  }, []);

  return (
    <div className="p-4 grid gap-4 grid-cols-[1fr_10fr]">
      <div className="text-sm font-bold text-gray-500 whitespace-nowrap">First Name</div>
      <div className="text-sm">{state?.firstName}</div>
      <div className="text-sm font-bold text-gray-500 whitespace-nowrap">Last Name</div>
      <div className="text-sm">{state?.lastName}</div>
    </div>
  );
}

export const DemoStoreDevtools = {
  name: "TanStack Demo Store",
  render: <DevtoolPanel />,
};

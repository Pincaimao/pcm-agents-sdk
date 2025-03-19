import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { MyComponent as MyComponentElement } from "pcm-agents/dist/components/my-component.js";
import { PcmChatModal as PcmChatModalElement } from "pcm-agents/dist/components/pcm-chat-modal.js";
type MyComponentEvents = NonNullable<unknown>;
export declare const MyComponent: StencilReactComponent<MyComponentElement, MyComponentEvents>;
type PcmChatModalEvents = {
    onMessageSent: EventName<CustomEvent<string>>;
    onModalClosed: EventName<CustomEvent<void>>;
};
export declare const PcmChatModal: StencilReactComponent<PcmChatModalElement, PcmChatModalEvents>;
export {};

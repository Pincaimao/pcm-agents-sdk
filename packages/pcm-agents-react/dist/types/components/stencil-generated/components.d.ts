import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { type ChatMessage, type PcmChatMessageCustomEvent } from "pcm-agents";
import { MyComponent as MyComponentElement } from "pcm-agents/dist/components/my-component.js";
import { PcmChatMessage as PcmChatMessageElement } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmChatModal as PcmChatModalElement } from "pcm-agents/dist/components/pcm-chat-modal.js";
type MyComponentEvents = NonNullable<unknown>;
export declare const MyComponent: StencilReactComponent<MyComponentElement, MyComponentEvents>;
type PcmChatMessageEvents = {
    onMessageChange: EventName<PcmChatMessageCustomEvent<Partial<ChatMessage>>>;
};
export declare const PcmChatMessage: StencilReactComponent<PcmChatMessageElement, PcmChatMessageEvents>;
type PcmChatModalEvents = {
    onMessageSent: EventName<CustomEvent<string>>;
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
};
export declare const PcmChatModal: StencilReactComponent<PcmChatModalElement, PcmChatModalEvents>;
export {};

'use client';
import { createComponent } from '@stencil/react-output-target/runtime';
import { MyComponent as MyComponentElement, defineCustomElement as defineMyComponent } from "pcm-agents/dist/components/my-component.js";
import { PcmChatMessage as PcmChatMessageElement, defineCustomElement as definePcmChatMessage } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmChatModal as PcmChatModalElement, defineCustomElement as definePcmChatModal } from "pcm-agents/dist/components/pcm-chat-modal.js";
import React from 'react';
export const MyComponent = createComponent({
    tagName: 'my-component',
    elementClass: MyComponentElement,
    react: React,
    events: {},
    defineCustomElement: defineMyComponent
});
export const PcmChatMessage = createComponent({
    tagName: 'pcm-chat-message',
    elementClass: PcmChatMessageElement,
    react: React,
    events: { onMessageChange: 'messageChange' },
    defineCustomElement: definePcmChatMessage
});
export const PcmChatModal = createComponent({
    tagName: 'pcm-chat-modal',
    elementClass: PcmChatModalElement,
    react: React,
    events: {
        onMessageSent: 'messageSent',
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete'
    },
    defineCustomElement: definePcmChatModal
});
//# sourceMappingURL=components.js.map
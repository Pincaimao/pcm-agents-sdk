'use client';
import { createComponent } from '@stencil/react-output-target/runtime';
import { MyComponent as MyComponentElement, defineCustomElement as defineMyComponent } from "pcm-agents/dist/components/my-component.js";
import { PcmAppChatModal as PcmAppChatModalElement, defineCustomElement as definePcmAppChatModal } from "pcm-agents/dist/components/pcm-app-chat-modal.js";
import { PcmChatMessage as PcmChatMessageElement, defineCustomElement as definePcmChatMessage } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmChatModal as PcmChatModalElement, defineCustomElement as definePcmChatModal } from "pcm-agents/dist/components/pcm-chat-modal.js";
import { PcmHrChatModal as PcmHrChatModalElement, defineCustomElement as definePcmHrChatModal } from "pcm-agents/dist/components/pcm-hr-chat-modal.js";
import { PcmMnmsModal as PcmMnmsModalElement, defineCustomElement as definePcmMnmsModal } from "pcm-agents/dist/components/pcm-mnms-modal.js";
import { PcmVideoChatModal as PcmVideoChatModalElement, defineCustomElement as definePcmVideoChatModal } from "pcm-agents/dist/components/pcm-video-chat-modal.js";
import React from 'react';
export const MyComponent = createComponent({
    tagName: 'my-component',
    elementClass: MyComponentElement,
    react: React,
    events: {},
    defineCustomElement: defineMyComponent
});
export const PcmAppChatModal = createComponent({
    tagName: 'pcm-app-chat-modal',
    elementClass: PcmAppChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange'
    },
    defineCustomElement: definePcmAppChatModal
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
export const PcmHrChatModal = createComponent({
    tagName: 'pcm-hr-chat-modal',
    elementClass: PcmHrChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange'
    },
    defineCustomElement: definePcmHrChatModal
});
export const PcmMnmsModal = createComponent({
    tagName: 'pcm-mnms-modal',
    elementClass: PcmMnmsModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete'
    },
    defineCustomElement: definePcmMnmsModal
});
export const PcmVideoChatModal = createComponent({
    tagName: 'pcm-video-chat-modal',
    elementClass: PcmVideoChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange'
    },
    defineCustomElement: definePcmVideoChatModal
});
//# sourceMappingURL=components.js.map
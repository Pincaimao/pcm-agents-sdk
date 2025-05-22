'use client';
import { createComponent } from '@stencil/react-output-target/runtime';
import { Pcm1zhanshiMnmsModal as Pcm1zhanshiMnmsModalElement, defineCustomElement as definePcm1zhanshiMnmsModal } from "pcm-agents/dist/components/pcm-1zhanshi-mnms-modal.js";
import { PcmAppChatModal as PcmAppChatModalElement, defineCustomElement as definePcmAppChatModal } from "pcm-agents/dist/components/pcm-app-chat-modal.js";
import { PcmButton as PcmButtonElement, defineCustomElement as definePcmButton } from "pcm-agents/dist/components/pcm-button.js";
import { PcmCard as PcmCardElement, defineCustomElement as definePcmCard } from "pcm-agents/dist/components/pcm-card.js";
import { PcmChatMessage as PcmChatMessageElement, defineCustomElement as definePcmChatMessage } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmDrawer as PcmDrawerElement, defineCustomElement as definePcmDrawer } from "pcm-agents/dist/components/pcm-drawer.js";
import { PcmHrChatModal as PcmHrChatModalElement, defineCustomElement as definePcmHrChatModal } from "pcm-agents/dist/components/pcm-hr-chat-modal.js";
import { PcmHtwsModal as PcmHtwsModalElement, defineCustomElement as definePcmHtwsModal } from "pcm-agents/dist/components/pcm-htws-modal.js";
import { PcmHyzjModal as PcmHyzjModalElement, defineCustomElement as definePcmHyzjModal } from "pcm-agents/dist/components/pcm-hyzj-modal.js";
import { PcmJdModal as PcmJdModalElement, defineCustomElement as definePcmJdModal } from "pcm-agents/dist/components/pcm-jd-modal.js";
import { PcmJlppModal as PcmJlppModalElement, defineCustomElement as definePcmJlppModal } from "pcm-agents/dist/components/pcm-jlpp-modal.js";
import { PcmMnctModal as PcmMnctModalElement, defineCustomElement as definePcmMnctModal } from "pcm-agents/dist/components/pcm-mnct-modal.js";
import { PcmMnmsModal as PcmMnmsModalElement, defineCustomElement as definePcmMnmsModal } from "pcm-agents/dist/components/pcm-mnms-modal.js";
import { PcmMnmsVideoModal as PcmMnmsVideoModalElement, defineCustomElement as definePcmMnmsVideoModal } from "pcm-agents/dist/components/pcm-mnms-video-modal.js";
import { PcmMnmsZpModal as PcmMnmsZpModalElement, defineCustomElement as definePcmMnmsZpModal } from "pcm-agents/dist/components/pcm-mnms-zp-modal.js";
import { PcmMsbgModal as PcmMsbgModalElement, defineCustomElement as definePcmMsbgModal } from "pcm-agents/dist/components/pcm-msbg-modal.js";
import { PcmZskChatModal as PcmZskChatModalElement, defineCustomElement as definePcmZskChatModal } from "pcm-agents/dist/components/pcm-zsk-chat-modal.js";
import { PcmZyghModal as PcmZyghModalElement, defineCustomElement as definePcmZyghModal } from "pcm-agents/dist/components/pcm-zygh-modal.js";
import React from 'react';
export const Pcm1zhanshiMnmsModal = createComponent({
    tagName: 'pcm-1zhanshi-mnms-modal',
    elementClass: Pcm1zhanshiMnmsModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent',
        onRecordingError: 'recordingError'
    },
    defineCustomElement: definePcm1zhanshiMnmsModal
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
        onRecordingStatusChange: 'recordingStatusChange',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmAppChatModal
});
export const PcmButton = createComponent({
    tagName: 'pcm-button',
    elementClass: PcmButtonElement,
    react: React,
    events: {},
    defineCustomElement: definePcmButton
});
export const PcmCard = createComponent({
    tagName: 'pcm-card',
    elementClass: PcmCardElement,
    react: React,
    events: { onTokenInvalid: 'tokenInvalid' },
    defineCustomElement: definePcmCard
});
export const PcmChatMessage = createComponent({
    tagName: 'pcm-chat-message',
    elementClass: PcmChatMessageElement,
    react: React,
    events: {
        onMessageChange: 'messageChange',
        onFilePreviewRequest: 'filePreviewRequest'
    },
    defineCustomElement: definePcmChatMessage
});
export const PcmDrawer = createComponent({
    tagName: 'pcm-drawer',
    elementClass: PcmDrawerElement,
    react: React,
    events: {
        onClosed: 'closed',
        onAfterOpen: 'afterOpen',
        onAfterClose: 'afterClose'
    },
    defineCustomElement: definePcmDrawer
});
export const PcmHrChatModal = createComponent({
    tagName: 'pcm-hr-chat-modal',
    elementClass: PcmHrChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmHrChatModal
});
export const PcmHtwsModal = createComponent({
    tagName: 'pcm-htws-modal',
    elementClass: PcmHtwsModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    },
    defineCustomElement: definePcmHtwsModal
});
export const PcmHyzjModal = createComponent({
    tagName: 'pcm-hyzj-modal',
    elementClass: PcmHyzjModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    },
    defineCustomElement: definePcmHyzjModal
});
export const PcmJdModal = createComponent({
    tagName: 'pcm-jd-modal',
    elementClass: PcmJdModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    },
    defineCustomElement: definePcmJdModal
});
export const PcmJlppModal = createComponent({
    tagName: 'pcm-jlpp-modal',
    elementClass: PcmJlppModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    },
    defineCustomElement: definePcmJlppModal
});
export const PcmMnctModal = createComponent({
    tagName: 'pcm-mnct-modal',
    elementClass: PcmMnctModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    },
    defineCustomElement: definePcmMnctModal
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
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent',
        onRecordingError: 'recordingError'
    },
    defineCustomElement: definePcmMnmsModal
});
export const PcmMnmsVideoModal = createComponent({
    tagName: 'pcm-mnms-video-modal',
    elementClass: PcmMnmsVideoModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent',
        onRecordingError: 'recordingError'
    },
    defineCustomElement: definePcmMnmsVideoModal
});
export const PcmMnmsZpModal = createComponent({
    tagName: 'pcm-mnms-zp-modal',
    elementClass: PcmMnmsZpModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent',
        onRecordingError: 'recordingError'
    },
    defineCustomElement: definePcmMnmsZpModal
});
export const PcmMsbgModal = createComponent({
    tagName: 'pcm-msbg-modal',
    elementClass: PcmMsbgModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    },
    defineCustomElement: definePcmMsbgModal
});
export const PcmZskChatModal = createComponent({
    tagName: 'pcm-zsk-chat-modal',
    elementClass: PcmZskChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onTokenInvalid: 'tokenInvalid',
        onClearConversation: 'clearConversation'
    },
    defineCustomElement: definePcmZskChatModal
});
export const PcmZyghModal = createComponent({
    tagName: 'pcm-zygh-modal',
    elementClass: PcmZyghModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onPlanningComplete: 'planningComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    },
    defineCustomElement: definePcmZyghModal
});
//# sourceMappingURL=components.js.map
'use client';

/**
 * This file was automatically generated by the Stencil React Output Target.
 * Changes to this file may cause incorrect behavior and will be lost if the code is regenerated.
 */

/* eslint-disable */

import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { createComponent } from '@stencil/react-output-target/runtime';
import { type CareerPlanType, type ChatMessage, type ConversationStartEventData, type ErrorEventDetail, type FileUploadResponse, type InterviewCompleteEventData, type Pcm1zhanshiMnmsModalCustomEvent, type PcmAppChatModalCustomEvent, type PcmChatMessageCustomEvent, type PcmHrChatModalCustomEvent, type PcmHtwsModalCustomEvent, type PcmHyzjModalCustomEvent, type PcmJdModalCustomEvent, type PcmJlppModalCustomEvent, type PcmJlsxModalCustomEvent, type PcmMnctModalCustomEvent, type PcmMnmsModalCustomEvent, type PcmMnmsVideoModalCustomEvent, type PcmMnmsZpModalCustomEvent, type PcmMsbgModalCustomEvent, type PcmQgqjlModalCustomEvent, type PcmUploadCustomEvent, type PcmZskChatModalCustomEvent, type PcmZyghModalCustomEvent, type RecordingErrorEventData, type RecordingStatusChangeEventData, type ResumeAnalysisCompleteEventData, type ResumeAnalysisStartEventData, type ResumeDeletedEventData, type StreamCompleteEventData, type TaskCreatedEventData, type TaskSwitchEventData, type UploadFailedEvent } from "pcm-agents";
import { Pcm1zhanshiMnmsModal as Pcm1zhanshiMnmsModalElement, defineCustomElement as definePcm1zhanshiMnmsModal } from "pcm-agents/dist/components/pcm-1zhanshi-mnms-modal.js";
import { PcmAppChatModal as PcmAppChatModalElement, defineCustomElement as definePcmAppChatModal } from "pcm-agents/dist/components/pcm-app-chat-modal.js";
import { PcmButton as PcmButtonElement, defineCustomElement as definePcmButton } from "pcm-agents/dist/components/pcm-button.js";
import { PcmCard as PcmCardElement, defineCustomElement as definePcmCard } from "pcm-agents/dist/components/pcm-card.js";
import { PcmChatMessage as PcmChatMessageElement, defineCustomElement as definePcmChatMessage } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmConfirmModal as PcmConfirmModalElement, defineCustomElement as definePcmConfirmModal } from "pcm-agents/dist/components/pcm-confirm-modal.js";
import { PcmDrawer as PcmDrawerElement, defineCustomElement as definePcmDrawer } from "pcm-agents/dist/components/pcm-drawer.js";
import { PcmHrChatModal as PcmHrChatModalElement, defineCustomElement as definePcmHrChatModal } from "pcm-agents/dist/components/pcm-hr-chat-modal.js";
import { PcmHtwsModal as PcmHtwsModalElement, defineCustomElement as definePcmHtwsModal } from "pcm-agents/dist/components/pcm-htws-modal.js";
import { PcmHyzjModal as PcmHyzjModalElement, defineCustomElement as definePcmHyzjModal } from "pcm-agents/dist/components/pcm-hyzj-modal.js";
import { PcmJdModal as PcmJdModalElement, defineCustomElement as definePcmJdModal } from "pcm-agents/dist/components/pcm-jd-modal.js";
import { PcmJlppModal as PcmJlppModalElement, defineCustomElement as definePcmJlppModal } from "pcm-agents/dist/components/pcm-jlpp-modal.js";
import { PcmJlsxModal as PcmJlsxModalElement, defineCustomElement as definePcmJlsxModal } from "pcm-agents/dist/components/pcm-jlsx-modal.js";
import { PcmMessage as PcmMessageElement, defineCustomElement as definePcmMessage } from "pcm-agents/dist/components/pcm-message.js";
import { PcmMnctModal as PcmMnctModalElement, defineCustomElement as definePcmMnctModal } from "pcm-agents/dist/components/pcm-mnct-modal.js";
import { PcmMnmsModal as PcmMnmsModalElement, defineCustomElement as definePcmMnmsModal } from "pcm-agents/dist/components/pcm-mnms-modal.js";
import { PcmMnmsVideoModal as PcmMnmsVideoModalElement, defineCustomElement as definePcmMnmsVideoModal } from "pcm-agents/dist/components/pcm-mnms-video-modal.js";
import { PcmMnmsZpModal as PcmMnmsZpModalElement, defineCustomElement as definePcmMnmsZpModal } from "pcm-agents/dist/components/pcm-mnms-zp-modal.js";
import { PcmMobileInputBtn as PcmMobileInputBtnElement, defineCustomElement as definePcmMobileInputBtn } from "pcm-agents/dist/components/pcm-mobile-input-btn.js";
import { PcmMobileUploadBtn as PcmMobileUploadBtnElement, defineCustomElement as definePcmMobileUploadBtn } from "pcm-agents/dist/components/pcm-mobile-upload-btn.js";
import { PcmMsbgModal as PcmMsbgModalElement, defineCustomElement as definePcmMsbgModal } from "pcm-agents/dist/components/pcm-msbg-modal.js";
import { PcmQgqjlModal as PcmQgqjlModalElement, defineCustomElement as definePcmQgqjlModal } from "pcm-agents/dist/components/pcm-qgqjl-modal.js";
import { PcmTimeCountDown as PcmTimeCountDownElement, defineCustomElement as definePcmTimeCountDown } from "pcm-agents/dist/components/pcm-time-count-down.js";
import { PcmUpload as PcmUploadElement, defineCustomElement as definePcmUpload } from "pcm-agents/dist/components/pcm-upload.js";
import { PcmZskChatModal as PcmZskChatModalElement, defineCustomElement as definePcmZskChatModal } from "pcm-agents/dist/components/pcm-zsk-chat-modal.js";
import { PcmZyghModal as PcmZyghModalElement, defineCustomElement as definePcmZyghModal } from "pcm-agents/dist/components/pcm-zygh-modal.js";
import React from 'react';

type Pcm1zhanshiMnmsModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<Pcm1zhanshiMnmsModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<Pcm1zhanshiMnmsModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<Pcm1zhanshiMnmsModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<Pcm1zhanshiMnmsModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<Pcm1zhanshiMnmsModalCustomEvent<ErrorEventDetail>>,
    onRecordingError: EventName<Pcm1zhanshiMnmsModalCustomEvent<RecordingErrorEventData>>
};

export const Pcm1zhanshiMnmsModal: StencilReactComponent<Pcm1zhanshiMnmsModalElement, Pcm1zhanshiMnmsModalEvents> = /*@__PURE__*/ createComponent<Pcm1zhanshiMnmsModalElement, Pcm1zhanshiMnmsModalEvents>({
    tagName: 'pcm-1zhanshi-mnms-modal',
    elementClass: Pcm1zhanshiMnmsModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
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
    } as Pcm1zhanshiMnmsModalEvents,
    defineCustomElement: definePcm1zhanshiMnmsModal
});

type PcmAppChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onStreamComplete: EventName<PcmAppChatModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmAppChatModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmAppChatModalCustomEvent<InterviewCompleteEventData>>,
    onRecordingError: EventName<PcmAppChatModalCustomEvent<RecordingErrorEventData>>,
    onRecordingStatusChange: EventName<PcmAppChatModalCustomEvent<RecordingStatusChangeEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>
};

export const PcmAppChatModal: StencilReactComponent<PcmAppChatModalElement, PcmAppChatModalEvents> = /*@__PURE__*/ createComponent<PcmAppChatModalElement, PcmAppChatModalEvents>({
    tagName: 'pcm-app-chat-modal',
    elementClass: PcmAppChatModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange',
        onTokenInvalid: 'tokenInvalid'
    } as PcmAppChatModalEvents,
    defineCustomElement: definePcmAppChatModal
});

type PcmButtonEvents = NonNullable<unknown>;

export const PcmButton: StencilReactComponent<PcmButtonElement, PcmButtonEvents> = /*@__PURE__*/ createComponent<PcmButtonElement, PcmButtonEvents>({
    tagName: 'pcm-button',
    elementClass: PcmButtonElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {} as PcmButtonEvents,
    defineCustomElement: definePcmButton
});

type PcmCardEvents = { onTokenInvalid: EventName<CustomEvent<void>> };

export const PcmCard: StencilReactComponent<PcmCardElement, PcmCardEvents> = /*@__PURE__*/ createComponent<PcmCardElement, PcmCardEvents>({
    tagName: 'pcm-card',
    elementClass: PcmCardElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: { onTokenInvalid: 'tokenInvalid' } as PcmCardEvents,
    defineCustomElement: definePcmCard
});

type PcmChatMessageEvents = {
    onMessageChange: EventName<PcmChatMessageCustomEvent<Partial<ChatMessage>>>,
    onFilePreviewRequest: EventName<CustomEvent<{
        url?: string,
        fileName: string,
        content?: string,
        contentType: 'file' | 'markdown' | 'text'
    }>>,
    onRetryRequest: EventName<CustomEvent<string>>
};

export const PcmChatMessage: StencilReactComponent<PcmChatMessageElement, PcmChatMessageEvents> = /*@__PURE__*/ createComponent<PcmChatMessageElement, PcmChatMessageEvents>({
    tagName: 'pcm-chat-message',
    elementClass: PcmChatMessageElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onMessageChange: 'messageChange',
        onFilePreviewRequest: 'filePreviewRequest',
        onRetryRequest: 'retryRequest'
    } as PcmChatMessageEvents,
    defineCustomElement: definePcmChatMessage
});

type PcmConfirmModalEvents = {
    onOk: EventName<CustomEvent<void>>,
    onCancel: EventName<CustomEvent<void>>,
    onClosed: EventName<CustomEvent<void>>,
    onAfterOpen: EventName<CustomEvent<void>>,
    onAfterClose: EventName<CustomEvent<void>>
};

export const PcmConfirmModal: StencilReactComponent<PcmConfirmModalElement, PcmConfirmModalEvents> = /*@__PURE__*/ createComponent<PcmConfirmModalElement, PcmConfirmModalEvents>({
    tagName: 'pcm-confirm-modal',
    elementClass: PcmConfirmModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onOk: 'ok',
        onCancel: 'cancel',
        onClosed: 'closed',
        onAfterOpen: 'afterOpen',
        onAfterClose: 'afterClose'
    } as PcmConfirmModalEvents,
    defineCustomElement: definePcmConfirmModal
});

type PcmDrawerEvents = {
    onClosed: EventName<CustomEvent<void>>,
    onAfterOpen: EventName<CustomEvent<void>>,
    onAfterClose: EventName<CustomEvent<void>>
};

export const PcmDrawer: StencilReactComponent<PcmDrawerElement, PcmDrawerEvents> = /*@__PURE__*/ createComponent<PcmDrawerElement, PcmDrawerEvents>({
    tagName: 'pcm-drawer',
    elementClass: PcmDrawerElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onClosed: 'closed',
        onAfterOpen: 'afterOpen',
        onAfterClose: 'afterClose'
    } as PcmDrawerEvents,
    defineCustomElement: definePcmDrawer
});

type PcmHrChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onStreamComplete: EventName<PcmHrChatModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmHrChatModalCustomEvent<ConversationStartEventData>>,
    onSomeErrorEvent: EventName<PcmHrChatModalCustomEvent<ErrorEventDetail>>,
    onInterviewComplete: EventName<PcmHrChatModalCustomEvent<InterviewCompleteEventData>>,
    onRecordingError: EventName<CustomEvent<{
        type: string;
        message: string;
        details?: any;
    }>>,
    onRecordingStatusChange: EventName<CustomEvent<{
        status: 'started' | 'stopped' | 'paused' | 'resumed' | 'failed';
        details?: any;
    }>>,
    onTokenInvalid: EventName<CustomEvent<void>>
};

export const PcmHrChatModal: StencilReactComponent<PcmHrChatModalElement, PcmHrChatModalEvents> = /*@__PURE__*/ createComponent<PcmHrChatModalElement, PcmHrChatModalEvents>({
    tagName: 'pcm-hr-chat-modal',
    elementClass: PcmHrChatModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onSomeErrorEvent: 'someErrorEvent',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange',
        onTokenInvalid: 'tokenInvalid'
    } as PcmHrChatModalEvents,
    defineCustomElement: definePcmHrChatModal
});

type PcmHtwsModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmHtwsModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmHtwsModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmHtwsModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmHtwsModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmHtwsModalCustomEvent<ErrorEventDetail>>
};

export const PcmHtwsModal: StencilReactComponent<PcmHtwsModalElement, PcmHtwsModalEvents> = /*@__PURE__*/ createComponent<PcmHtwsModalElement, PcmHtwsModalEvents>({
    tagName: 'pcm-htws-modal',
    elementClass: PcmHtwsModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    } as PcmHtwsModalEvents,
    defineCustomElement: definePcmHtwsModal
});

type PcmHyzjModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmHyzjModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmHyzjModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmHyzjModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmHyzjModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmHyzjModalCustomEvent<ErrorEventDetail>>
};

export const PcmHyzjModal: StencilReactComponent<PcmHyzjModalElement, PcmHyzjModalEvents> = /*@__PURE__*/ createComponent<PcmHyzjModalElement, PcmHyzjModalEvents>({
    tagName: 'pcm-hyzj-modal',
    elementClass: PcmHyzjModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    } as PcmHyzjModalEvents,
    defineCustomElement: definePcmHyzjModal
});

type PcmJdModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onStreamComplete: EventName<PcmJdModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmJdModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmJdModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmJdModalCustomEvent<ErrorEventDetail>>
};

export const PcmJdModal: StencilReactComponent<PcmJdModalElement, PcmJdModalEvents> = /*@__PURE__*/ createComponent<PcmJdModalElement, PcmJdModalEvents>({
    tagName: 'pcm-jd-modal',
    elementClass: PcmJdModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    } as PcmJdModalEvents,
    defineCustomElement: definePcmJdModal
});

type PcmJlppModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmJlppModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmJlppModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmJlppModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmJlppModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmJlppModalCustomEvent<ErrorEventDetail>>
};

export const PcmJlppModal: StencilReactComponent<PcmJlppModalElement, PcmJlppModalEvents> = /*@__PURE__*/ createComponent<PcmJlppModalElement, PcmJlppModalEvents>({
    tagName: 'pcm-jlpp-modal',
    elementClass: PcmJlppModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    } as PcmJlppModalEvents,
    defineCustomElement: definePcmJlppModal
});

type PcmJlsxModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmJlsxModalCustomEvent<FileUploadResponse>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmJlsxModalCustomEvent<ErrorEventDetail>>,
    onTaskCreated: EventName<PcmJlsxModalCustomEvent<TaskCreatedEventData>>,
    onResumeAnalysisStart: EventName<PcmJlsxModalCustomEvent<ResumeAnalysisStartEventData>>,
    onResumeAnalysisComplete: EventName<PcmJlsxModalCustomEvent<ResumeAnalysisCompleteEventData>>,
    onTaskSwitch: EventName<PcmJlsxModalCustomEvent<TaskSwitchEventData>>,
    onResumeDeleted: EventName<PcmJlsxModalCustomEvent<ResumeDeletedEventData>>
};

export const PcmJlsxModal: StencilReactComponent<PcmJlsxModalElement, PcmJlsxModalEvents> = /*@__PURE__*/ createComponent<PcmJlsxModalElement, PcmJlsxModalEvents>({
    tagName: 'pcm-jlsx-modal',
    elementClass: PcmJlsxModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent',
        onTaskCreated: 'taskCreated',
        onResumeAnalysisStart: 'resumeAnalysisStart',
        onResumeAnalysisComplete: 'resumeAnalysisComplete',
        onTaskSwitch: 'taskSwitch',
        onResumeDeleted: 'resumeDeleted'
    } as PcmJlsxModalEvents,
    defineCustomElement: definePcmJlsxModal
});

type PcmMessageEvents = NonNullable<unknown>;

export const PcmMessage: StencilReactComponent<PcmMessageElement, PcmMessageEvents> = /*@__PURE__*/ createComponent<PcmMessageElement, PcmMessageEvents>({
    tagName: 'pcm-message',
    elementClass: PcmMessageElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {} as PcmMessageEvents,
    defineCustomElement: definePcmMessage
});

type PcmMnctModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmMnctModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmMnctModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmMnctModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmMnctModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmMnctModalCustomEvent<ErrorEventDetail>>
};

export const PcmMnctModal: StencilReactComponent<PcmMnctModalElement, PcmMnctModalEvents> = /*@__PURE__*/ createComponent<PcmMnctModalElement, PcmMnctModalEvents>({
    tagName: 'pcm-mnct-modal',
    elementClass: PcmMnctModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    } as PcmMnctModalEvents,
    defineCustomElement: definePcmMnctModal
});

type PcmMnmsModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmMnmsModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmMnmsModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmMnmsModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmMnmsModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmMnmsModalCustomEvent<ErrorEventDetail>>,
    onRecordingError: EventName<PcmMnmsModalCustomEvent<RecordingErrorEventData>>
};

export const PcmMnmsModal: StencilReactComponent<PcmMnmsModalElement, PcmMnmsModalEvents> = /*@__PURE__*/ createComponent<PcmMnmsModalElement, PcmMnmsModalEvents>({
    tagName: 'pcm-mnms-modal',
    elementClass: PcmMnmsModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
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
    } as PcmMnmsModalEvents,
    defineCustomElement: definePcmMnmsModal
});

type PcmMnmsVideoModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmMnmsVideoModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmMnmsVideoModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmMnmsVideoModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmMnmsVideoModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmMnmsVideoModalCustomEvent<ErrorEventDetail>>,
    onRecordingError: EventName<PcmMnmsVideoModalCustomEvent<RecordingErrorEventData>>
};

export const PcmMnmsVideoModal: StencilReactComponent<PcmMnmsVideoModalElement, PcmMnmsVideoModalEvents> = /*@__PURE__*/ createComponent<PcmMnmsVideoModalElement, PcmMnmsVideoModalEvents>({
    tagName: 'pcm-mnms-video-modal',
    elementClass: PcmMnmsVideoModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
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
    } as PcmMnmsVideoModalEvents,
    defineCustomElement: definePcmMnmsVideoModal
});

type PcmMnmsZpModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmMnmsZpModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmMnmsZpModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmMnmsZpModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmMnmsZpModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmMnmsZpModalCustomEvent<ErrorEventDetail>>,
    onRecordingError: EventName<PcmMnmsZpModalCustomEvent<RecordingErrorEventData>>
};

export const PcmMnmsZpModal: StencilReactComponent<PcmMnmsZpModalElement, PcmMnmsZpModalEvents> = /*@__PURE__*/ createComponent<PcmMnmsZpModalElement, PcmMnmsZpModalEvents>({
    tagName: 'pcm-mnms-zp-modal',
    elementClass: PcmMnmsZpModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
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
    } as PcmMnmsZpModalEvents,
    defineCustomElement: definePcmMnmsZpModal
});

type PcmMobileInputBtnEvents = { onOk: EventName<CustomEvent<string>> };

export const PcmMobileInputBtn: StencilReactComponent<PcmMobileInputBtnElement, PcmMobileInputBtnEvents> = /*@__PURE__*/ createComponent<PcmMobileInputBtnElement, PcmMobileInputBtnEvents>({
    tagName: 'pcm-mobile-input-btn',
    elementClass: PcmMobileInputBtnElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: { onOk: 'ok' } as PcmMobileInputBtnEvents,
    defineCustomElement: definePcmMobileInputBtn
});

type PcmMobileUploadBtnEvents = { onOk: EventName<CustomEvent<any[]>> };

export const PcmMobileUploadBtn: StencilReactComponent<PcmMobileUploadBtnElement, PcmMobileUploadBtnEvents> = /*@__PURE__*/ createComponent<PcmMobileUploadBtnElement, PcmMobileUploadBtnEvents>({
    tagName: 'pcm-mobile-upload-btn',
    elementClass: PcmMobileUploadBtnElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: { onOk: 'ok' } as PcmMobileUploadBtnEvents,
    defineCustomElement: definePcmMobileUploadBtn
});

type PcmMsbgModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmMsbgModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmMsbgModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmMsbgModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmMsbgModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmMsbgModalCustomEvent<ErrorEventDetail>>
};

export const PcmMsbgModal: StencilReactComponent<PcmMsbgModalElement, PcmMsbgModalEvents> = /*@__PURE__*/ createComponent<PcmMsbgModalElement, PcmMsbgModalEvents>({
    tagName: 'pcm-msbg-modal',
    elementClass: PcmMsbgModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    } as PcmMsbgModalEvents,
    defineCustomElement: definePcmMsbgModal
});

type PcmQgqjlModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmQgqjlModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmQgqjlModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmQgqjlModalCustomEvent<ConversationStartEventData>>,
    onInterviewComplete: EventName<PcmQgqjlModalCustomEvent<InterviewCompleteEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmQgqjlModalCustomEvent<ErrorEventDetail>>
};

export const PcmQgqjlModal: StencilReactComponent<PcmQgqjlModalElement, PcmQgqjlModalEvents> = /*@__PURE__*/ createComponent<PcmQgqjlModalElement, PcmQgqjlModalEvents>({
    tagName: 'pcm-qgqjl-modal',
    elementClass: PcmQgqjlModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    } as PcmQgqjlModalEvents,
    defineCustomElement: definePcmQgqjlModal
});

type PcmTimeCountDownEvents = { onFinished: EventName<CustomEvent<any>> };

export const PcmTimeCountDown: StencilReactComponent<PcmTimeCountDownElement, PcmTimeCountDownEvents> = /*@__PURE__*/ createComponent<PcmTimeCountDownElement, PcmTimeCountDownEvents>({
    tagName: 'pcm-time-count-down',
    elementClass: PcmTimeCountDownElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: { onFinished: 'finished' } as PcmTimeCountDownEvents,
    defineCustomElement: definePcmTimeCountDown
});

type PcmUploadEvents = {
    onUploadFailed: EventName<PcmUploadCustomEvent<UploadFailedEvent>>,
    onUploadChange: EventName<PcmUploadCustomEvent<FileUploadResponse[]>>
};

export const PcmUpload: StencilReactComponent<PcmUploadElement, PcmUploadEvents> = /*@__PURE__*/ createComponent<PcmUploadElement, PcmUploadEvents>({
    tagName: 'pcm-upload',
    elementClass: PcmUploadElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onUploadFailed: 'uploadFailed',
        onUploadChange: 'uploadChange'
    } as PcmUploadEvents,
    defineCustomElement: definePcmUpload
});

type PcmZskChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onStreamComplete: EventName<PcmZskChatModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmZskChatModalCustomEvent<ConversationStartEventData>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onClearConversation: EventName<CustomEvent<string>>
};

export const PcmZskChatModal: StencilReactComponent<PcmZskChatModalElement, PcmZskChatModalEvents> = /*@__PURE__*/ createComponent<PcmZskChatModalElement, PcmZskChatModalEvents>({
    tagName: 'pcm-zsk-chat-modal',
    elementClass: PcmZskChatModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onTokenInvalid: 'tokenInvalid',
        onClearConversation: 'clearConversation'
    } as PcmZskChatModalEvents,
    defineCustomElement: definePcmZskChatModal
});

type PcmZyghModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>,
    onUploadSuccess: EventName<PcmZyghModalCustomEvent<FileUploadResponse>>,
    onStreamComplete: EventName<PcmZyghModalCustomEvent<StreamCompleteEventData>>,
    onConversationStart: EventName<PcmZyghModalCustomEvent<ConversationStartEventData>>,
    onPlanningComplete: EventName<PcmZyghModalCustomEvent<{
        conversation_id: string;
        type: CareerPlanType;
    }>>,
    onTokenInvalid: EventName<CustomEvent<void>>,
    onSomeErrorEvent: EventName<PcmZyghModalCustomEvent<ErrorEventDetail>>
};

export const PcmZyghModal: StencilReactComponent<PcmZyghModalElement, PcmZyghModalEvents> = /*@__PURE__*/ createComponent<PcmZyghModalElement, PcmZyghModalEvents>({
    tagName: 'pcm-zygh-modal',
    elementClass: PcmZyghModalElement,
    // @ts-ignore - React type of Stencil Output Target may differ from the React version used in the Nuxt.js project, this can be ignored.
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onPlanningComplete: 'planningComplete',
        onTokenInvalid: 'tokenInvalid',
        onSomeErrorEvent: 'someErrorEvent'
    } as PcmZyghModalEvents,
    defineCustomElement: definePcmZyghModal
});

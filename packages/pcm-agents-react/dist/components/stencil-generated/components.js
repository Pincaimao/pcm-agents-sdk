'use client';
import { createComponent } from '@stencil/react-output-target/runtime';
import { FloatImage as FloatImageElement, defineCustomElement as defineFloatImage } from "pcm-agents/dist/components/float-image.js";
import { MyComponent as MyComponentElement, defineCustomElement as defineMyComponent } from "pcm-agents/dist/components/my-component.js";
import React from 'react';
export const FloatImage = createComponent({
    tagName: 'float-image',
    elementClass: FloatImageElement,
    react: React,
    events: { onFloatImageClick: 'floatImageClick' },
    defineCustomElement: defineFloatImage
});
export const MyComponent = createComponent({
    tagName: 'my-component',
    elementClass: MyComponentElement,
    react: React,
    events: {},
    defineCustomElement: defineMyComponent
});
//# sourceMappingURL=components.js.map
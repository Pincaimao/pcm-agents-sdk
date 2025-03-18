import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { FloatImage as FloatImageElement } from "pcm-agents/dist/components/float-image.js";
import { MyComponent as MyComponentElement } from "pcm-agents/dist/components/my-component.js";
type FloatImageEvents = {
    onFloatImageClick: EventName<CustomEvent<void>>;
};
export declare const FloatImage: StencilReactComponent<FloatImageElement, FloatImageEvents>;
type MyComponentEvents = NonNullable<unknown>;
export declare const MyComponent: StencilReactComponent<MyComponentElement, MyComponentEvents>;
export {};

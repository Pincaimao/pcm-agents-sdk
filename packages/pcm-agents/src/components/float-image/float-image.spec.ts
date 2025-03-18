import { newSpecPage } from '@stencil/core/testing';
import { FloatImage } from './float-image';

describe('float-image', () => {
  it('renders', async () => {
    const { root } = await newSpecPage({
      components: [FloatImage],
      html: '<float-image></float-image>',
    });
    expect(root).toEqualHtml(`
      <float-image>
        <mock:shadow-root>
          <div class="float-container">
            <img alt="浮窗图片" height="60px" width="60px">
          </div>
        </mock:shadow-root>
      </float-image>
    `);
  });

  it('renders with values', async () => {
    const { root } = await newSpecPage({
      components: [FloatImage],
      html: '<float-image src="https://example.com/image.jpg" alt="客服" width="80px" height="80px"></float-image>',
    });
    expect(root).toEqualHtml(`
      <float-image src="https://example.com/image.jpg" alt="客服" width="80px" height="80px">
        <mock:shadow-root>
          <div class="float-container">
            <img alt="客服" height="80px" src="https://example.com/image.jpg" width="80px">
          </div>
        </mock:shadow-root>
      </float-image>
    `);
  });
}); 
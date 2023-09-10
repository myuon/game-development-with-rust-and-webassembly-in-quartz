import "./style.css";
import mainModule from "../build/main.wat?init";

let instance: WebAssembly.Instance;

const getMemoryView = () => {
  return new DataView((instance.exports.memory as WebAssembly.Memory).buffer);
};

const readJsString = (ciovec: number): string => {
  const mem = getMemoryView();

  const address = mem.getUint32(ciovec, true);
  const length = mem.getUint32(ciovec + 4, true);

  const data = new Uint8Array(mem.buffer, address, length);

  return new TextDecoder().decode(data);
};

const init = async () => {
  instance = await mainModule({
    env: {
      debug: (output: unknown) => {
        console.log(`debug: ${output}`);
      },
      abort: () => {
        throw new Error("=== abort ===");
      },
    },
    js: {
      console_log: (ciovec: number) => {
        console.log(readJsString(ciovec));
      },
      window: () => {
        return window;
      },
      window_document: (window: Window) => {
        console.log(window);
        return window.document;
      },
      document_get_element_by_id: (document: Document, id: number) => {
        const idStr = readJsString(id);
        return document.getElementById(idStr);
      },
      canvas_get_context: (canvas: HTMLCanvasElement, context: number) => {
        return canvas.getContext(readJsString(context));
      },
      context_move_to: (
        context: CanvasRenderingContext2D,
        x: number,
        y: number
      ) => {
        context.moveTo(x, y);
      },
      context_begin_path: (context: CanvasRenderingContext2D) => {
        context.beginPath();
      },
      context_line_to: (
        context: CanvasRenderingContext2D,
        x: number,
        y: number
      ) => {
        context.lineTo(x, y);
      },
      context_stroke: (context: CanvasRenderingContext2D) => {
        context.stroke();
      },
      context_fill: (context: CanvasRenderingContext2D) => {
        context.fill();
      },
      context_close_path: (context: CanvasRenderingContext2D) => {
        context.closePath();
      },
      context_set_fill_style: (
        context: CanvasRenderingContext2D,
        fillStyle: number
      ) => {
        context.fillStyle = readJsString(fillStyle);
      },
      math_random_minmax: (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      image_new: () => {
        return new Image();
      },
      image_set_src: (image: HTMLImageElement, src: number) => {
        image.src = readJsString(src);
      },
      image_set_onload: (image: HTMLImageElement, onload: number) => {
        image.onload = () => {
          console.log(instance.exports);
        };
      },
      context_draw_image: (
        context: CanvasRenderingContext2D,
        image: HTMLImageElement,
        x: number,
        y: number
      ) => {
        context.drawImage(image, x, y);
      },
    },
    wasi_snapshot_preview1: {
      fd_read: () => {},
      fd_filestat_get: () => {},
      fd_close: () => {},
      path_open: () => {},
      fd_write: (
        fd: number,
        ciovs: number,
        ciovs_len: number,
        nwritten: number
      ) => {
        if (ciovs_len !== 1) {
          throw new Error("ciovs_len !== 1");
        }

        const mem = getMemoryView();

        const address = mem.getUint32(ciovs, true);
        const length = mem.getUint32(ciovs + 4, true);

        const data = new Uint8Array(mem.buffer, address, length);

        if (fd === 0) {
          throw new Error(`[fd_write] fd=${fd} is not supported.`);
        } else if (fd === 1) {
          console.log(new TextDecoder().decode(data));
          mem.setInt32(nwritten, length, true);
        } else if (fd === 2) {
          console.error(new TextDecoder().decode(data));
          mem.setInt32(nwritten, length, true);
        } else {
          throw new Error(`[fd_write] fd=${fd} is not supported.`);
        }
      },
      environ_sizes_get: () => {},
      environ_get: () => {},
      args_sizes_get: () => {},
      args_get: () => {},
    },
  });
  const main = instance.exports.main as CallableFunction;

  const result = main();
  console.log(result);
};

init();

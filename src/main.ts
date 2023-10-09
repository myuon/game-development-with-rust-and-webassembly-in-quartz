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

let store: any[] = [];

const insert = (store: any[], value: any) => {
  store.push(value);
  return store.length - 1;
};

const get = <T>(store: any[], id: number) => {
  return store[id] as T;
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
        // dummy
        return 0;
      },
      window_document: (_windowId: number) => {
        // dummy
        return 0;
      },
      document_get_element_by_id: (_documentId: number, id: number) => {
        const idStr = readJsString(id);
        return insert(store, document.getElementById(idStr));
      },
      canvas_get_context: (canvasId: number, context: number) => {
        const canvas = get<HTMLCanvasElement>(store, canvasId);
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
      image_set_onload: (image: HTMLImageElement, callback_name: number) => {
        image.onload = () => {
          const callback = instance.exports[
            readJsString(callback_name)
          ] as CallableFunction;

          callback();
        };
      },
      image_set_onload_externref1: (
        image: HTMLImageElement,
        callback_name: number,
        context: unknown
      ) => {
        image.onload = () => {
          const callback = instance.exports[
            readJsString(callback_name)
          ] as CallableFunction;

          callback(image, context);
        };
      },
      image_set_onerror: (image: HTMLImageElement, callback_name: number) => {
        image.onerror = () => {
          const callback = instance.exports[
            readJsString(callback_name)
          ] as CallableFunction;

          callback();
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
      fetch: (url: number) => {
        return fetch(readJsString(url));
      },
      response_text: (response: Response) => {
        return response.text();
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

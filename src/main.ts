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

const writeJsString = (value: string, address: number, length: number) => {
  const mem = getMemoryView();

  const data = new Uint8Array(mem.buffer, address, length);

  const encoded = new TextEncoder().encode(value);

  data.set(encoded);
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
      debug: (output: bigint) => {
        let tag = Number(output) & 0xf;
        if (tag === 0) {
          console.log(`debug[i32]: ${output >> BigInt(32)}`);
        } else if (tag === 1) {
          console.log(`debug[address]: ${output >> BigInt(32)}`);
        } else if (tag === 2) {
          console.log(`debug[bool]: ${output >> BigInt(32)}`);
        } else if (tag === 4) {
          console.log(`debug[byte]: ${output >> BigInt(32)}`);
        } else {
          console.log(`debug[tag=${tag}]: ${output >> BigInt(32)}`);
        }
        return BigInt(0);
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
        return insert(store, canvas.getContext(readJsString(context)));
      },
      context_move_to: (contextId: number, x: number, y: number) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        context.moveTo(x, y);
      },
      context_begin_path: (contextId: number) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        context.beginPath();
      },
      context_line_to: (contextId: number, x: number, y: number) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        context.lineTo(x, y);
      },
      context_stroke: (contextId: number) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        context.stroke();
      },
      context_fill: (contextId: number) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        context.fill();
      },
      context_close_path: (contextId: number) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        context.closePath();
      },
      context_set_fill_style: (contextId: number, fillStyle: number) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        context.fillStyle = readJsString(fillStyle);
      },
      math_random_minmax: (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      image_new: () => {
        return insert(store, new Image());
      },
      image_set_src: (imageId: number, src: number) => {
        const image = get<HTMLImageElement>(store, imageId);
        image.src = readJsString(src);
      },
      image_set_onload: (imageId: number, f: number) => {
        const image = get<HTMLImageElement>(store, imageId);
        image.onload = () => {
          const callback = instance.exports["call_closure"] as CallableFunction;

          callback(BigInt(f) << BigInt(32));
        };
      },
      image_set_onerror: (imageId: number, f: number) => {
        const image = get<HTMLImageElement>(store, imageId);
        image.onerror = () => {
          const callback = instance.exports["call_closure"] as CallableFunction;

          callback(BigInt(f) << BigInt(32));
        };
      },
      context_draw_image: (
        contextId: number,
        imageId: number,
        x: number,
        y: number
      ) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        const image = get<HTMLImageElement>(store, imageId);
        context.drawImage(image, x, y);
      },
      context_draw_image_with_sw_sh_dx_dy_dw_dh: (
        contextId: number,
        imageId: number,
        x: number,
        y: number,
        w: number,
        h: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number
      ) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        const image = get<HTMLImageElement>(store, imageId);
        context.drawImage(image, x, y, w, h, dx, dy, dw, dh);
      },
      fetch: async (url: number, f: number) => {
        const resp = await fetch(readJsString(url));
        if (resp.ok) {
          const text = await resp.text();

          const callback = instance.exports[
            "call_closure_1"
          ] as CallableFunction;

          callback(
            BigInt(f) << BigInt(32),
            BigInt(insert(store, text)) << BigInt(32)
          );
        }
      },
      jsvalue_string_length: (jsvalueId: number) => {
        let value = get<string>(store, jsvalueId);
        return value.length;
      },
      jsvalue_string_set: (jsvalueId: number, data: number, length: number) => {
        let value = get<string>(store, jsvalueId);
        writeJsString(value, data, length);
      },
      set_interval_callback_with_timeout: (
        callbackId: number,
        timeout: number
      ) => {
        const callback = instance.exports["call_closure"] as CallableFunction;

        setInterval(() => {
          callback(BigInt(callbackId) << BigInt(32));
        }, timeout);
      },
      context_clear_rect: (
        contextId: number,
        x: number,
        y: number,
        width: number,
        height: number
      ) => {
        const context = get<CanvasRenderingContext2D>(store, contextId);
        context.clearRect(x, y, width, height);
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
      clock_time_get: () => {},
    },
  });
  const main = instance.exports.main as CallableFunction;

  const result = main();
  console.log(result);
};

init();

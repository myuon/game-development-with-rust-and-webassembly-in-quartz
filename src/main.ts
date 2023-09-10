import "./style.css";
import mainModule from "../build/main.wat?init";

let instance: WebAssembly.Instance;

const getMemoryView = () => {
  return new DataView((instance.exports.memory as WebAssembly.Memory).buffer);
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
        const mem = getMemoryView();

        const address = mem.getUint32(ciovec, true);
        const length = mem.getUint32(ciovec + 4, true);

        const data = new Uint8Array(mem.buffer, address, length);

        console.log(new TextDecoder().decode(data));

        return BigInt(0);
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

  main();
};

init();

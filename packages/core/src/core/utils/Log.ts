export const Log = {
  // TODO: This utility should be used by the SDK to log messages.
  // We will implement a platform specific log service later, then we need to update the implementation of this utility.
  debug: (message: string) => {
    var date = new Date();
    console.debug(`${date.toUTCString()} ${date.getMilliseconds()}[AEPSDK][D] ${message}`);
  },
  info: (message: string) => {
    var date = new Date();
    console.info(`${date.toUTCString()} ${date.getMilliseconds()}[AEPSDK][I] ${message}`);
  },
  warning: (message: string) => {
    var date = new Date();
    console.warn(`${date.toUTCString()} ${date.getMilliseconds()}[AEPSDK][w] ${message}`);
  },
  error: (message: string) => {
    var date = new Date();
    console.error(`${date.toUTCString()} ${date.getMilliseconds()}[AEPSDK][E] ${message}`);
  },
  verbose: (message: string) => {
    var date = new Date();
    console.log(`${date.toUTCString()} ${date.getMilliseconds()}[AEPSDK][V] ${message}`);
  },
};

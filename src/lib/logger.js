export const logger = {
  info(message, metadata) {
    console.log(message, metadata ?? "");
  },
  error(message, metadata) {
    console.error(message, metadata ?? "");
  }
};

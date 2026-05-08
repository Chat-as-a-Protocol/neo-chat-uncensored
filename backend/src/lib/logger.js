import { createLogger, format, transports } from "winston";

const loggerTransports = [new transports.Console()];
if (process.env.NODE_ENV !== "production") {
  loggerTransports.push(new transports.File({ filename: "app.log" }));
}

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: loggerTransports,
});

export default logger;

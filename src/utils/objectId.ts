import { ObjectId } from "mongodb";
import { HttpError } from "./httpError";

export const parseObjectId = (value: unknown, label = "id"): ObjectId => {
  // ObjectId.isValid() also accepts any 12-char string, so require the 24-char hex form.
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    throw HttpError.badRequest(`Invalid ${label}`);
  }
  return new ObjectId(value);
};

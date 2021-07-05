import { ILine, IRectangle } from "../models/common";
import { LayoutFn } from "./iembedder";
export declare const basicEmbed: LayoutFn;
export declare const expandLine: (line: ILine, bbox: IRectangle) => ILine;

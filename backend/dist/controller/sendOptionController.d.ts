import type { Request, Response } from "express";
interface BodyInputType {
    toAddress: String;
    lamports: number;
}
export declare const sendCredMap: Map<string, PublicKeyCredentialRequestOptionsJSON>;
export declare const sendInputMap: Map<string, BodyInputType>;
export declare const sendOptionController: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=sendOptionController.d.ts.map
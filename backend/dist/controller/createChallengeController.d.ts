import type { Request, Response } from "express";
export declare let credentialMap: Map<string, PublicKeyCredentialCreationOptionsJSON>;
export declare const createChallenge: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=createChallengeController.d.ts.map
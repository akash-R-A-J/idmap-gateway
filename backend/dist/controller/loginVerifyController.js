import { loginCredMap } from "./loginOptionsContoller.js";
import { getCredentialByIdAndUserId, updateCounter, } from "../helpers/credentials.js";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
export const loginVerifyController = async (req, res) => {
    const userId = req.userId;
    const { body } = req;
    if (!userId) {
        console.log("userId not found in loginVerifyController");
        return res.status(404).json({ message: "invalid credentials" });
    }
    try {
        const options = loginCredMap.get(userId);
        if (!options) {
            console.log("options not foFund in loginCredMap for this user", userId);
            return res.status(404).json({ message: "invalid credentials" });
        }
        const credential = await getCredentialByIdAndUserId({
            id: body.id,
            userId,
        });
        if (!credential) {
            console.log("credential not found in loginVerifyCredential.");
            return res.status(404).json({ message: "credential not found." });
        }
        // verify the solved challenge
        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: options.challenge,
            expectedOrigin: process.env.origin,
            expectedRPID: process.env.rpID,
            credential: {
                id: credential.id,
                publicKey: Uint8Array.from(credential.publickey),
                counter: Number(credential.counter),
                transports: credential.transports,
            },
        });
        const { verified, authenticationInfo } = verification;
        const { newCounter } = authenticationInfo;
        // delete challenge after verification
        loginCredMap.delete(userId);
        // update credential counter with 'newCounter'
        const updateCred = await updateCounter(credential.id, newCounter);
        console.log("updated cred after login: ", updateCred);
        res.status(200).json({ verified, message: "login successful" });
    }
    catch (error) {
        console.error("error in loginVerifyController", error);
        res.status(500).json({ message: "server error" });
    }
};
//# sourceMappingURL=loginVerifyController.js.map
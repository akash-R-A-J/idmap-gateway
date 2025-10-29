import { getUserById } from "../helpers/users.js";
import { generateRegistrationOptions } from "@simplewebauthn/server";
export let credentialMap = new Map();
// create challenege for client to sign for verification
export const createChallenge = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(400).json({ message: "invalid credential" });
    }
    try {
        const user = await getUserById(userId);
        // change the rpName
        // TODO : exclude already added authenticator using excludeCredentials
        const options = await generateRegistrationOptions({
            rpName: "hello",
            rpID: process.env.rpID,
            userName: user.username,
            attestationType: "direct",
            authenticatorSelection: {
                residentKey: "required",
                userVerification: "required", // can be preferred
                // authenticatorAttachment: can be 'platform' or 'cross-platform'
            },
            // preferredAuthenticatorType: 'securityKey' | 'localdevice' | 'remoteDevice' // select any one from these
        });
        credentialMap.set(userId, options);
        res.status(200).json({ options });
    }
    catch (error) {
        console.error("error adding webauthn", error);
        res.status(500).json({ message: "server error" });
    }
};
//# sourceMappingURL=createChallengeController.js.map
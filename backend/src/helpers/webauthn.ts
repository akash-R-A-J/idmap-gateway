import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import {
  getCredentialByIdAndUserId,
  getCredentialByUserId,
  updateCounter,
} from "./credentials.js";

// temporary map for verification of user
const credMap = new Map<string, PublicKeyCredentialRequestOptionsJSON>();

// creates webauthn challenge used during login and send txn
export const generateChallenge = async (userId: string) => {
  try {
    const credentials = await getCredentialByUserId(userId);
    if (!credentials || credentials.length === 0) {
      console.log("credentials not found for user in loginOptionsCredential");
      return null;
    }

    const allowCredentials = credentials.map((cred) => ({
      id: cred.id as Base64URLString,
      transports: cred.transports as AuthenticatorTransportFuture[],
    }));

    // generate challenge for login
    const authOptions = await generateAuthenticationOptions({
      rpID: process.env.rpID as string,
      allowCredentials: allowCredentials ?? undefined,
    });

    credMap.set(userId, authOptions);

    console.log(
      "sending challenge to the user for verification during login",
      authOptions
    );

    return authOptions;
  } catch (error) {
    console.error("error in generate challenge", error);
    return null;
  }
};

export const verifyChallenge = async (userId: string, signed: any) => {
  // Get the challenge for WebAuthn verification
  const options = credMap.get(userId);
  if (!options) {
    return null;
  }
  console.log("got options");

  const credential = await getCredentialByIdAndUserId({
    id: signed.id,
    userId,
  });

  if (!credential) {
    return null;
  }

  console.log("got correct credentials");

  // Verify authentication (WebAuthn)
  const verification = await verifyAuthenticationResponse({
    response: signed,
    expectedChallenge: options.challenge,
    expectedOrigin: process.env.origin as string,
    expectedRPID: process.env.rpID as string,
    credential: {
      id: credential.id,
      publicKey: Uint8Array.from(credential.publickey),
      counter: Number(credential.counter),
      transports: credential.transports,
    },
  });

  console.log("verification");

  const { verified, authenticationInfo } = verification;
  if (!verified) {
    return null;
  }

  console.log("verified");
  const { newCounter } = authenticationInfo;

  // Clean up challenge and update counter
  credMap.delete(userId);
  await updateCounter(credential.id, newCounter);

  console.log("updated counter");

  return verified;
};

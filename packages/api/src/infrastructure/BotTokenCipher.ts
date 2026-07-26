import crypto from 'node:crypto';

import { BotTokenEncryptionKeyError, DecryptionError } from '../core/errors/InternalServerErrors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export default class BotTokenCipher {
    private readonly key: Buffer;

    constructor(encryptionKey: string) {
        if (!encryptionKey || encryptionKey.length < 16) {
            throw new BotTokenEncryptionKeyError();
        }
        this.key = crypto.createHash('sha256').update(encryptionKey).digest();
    }

    encrypt(plain: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
        const ciphertext = Buffer.concat([cipher.update(plain, 'utf-8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return [
            iv.toString('base64'),
            authTag.toString('base64'),
            ciphertext.toString('base64'),
        ].join(':');
    }

    decrypt(payload: string): string {
        const parts = payload.split(':');
        if (parts.length !== 3) {
            throw new DecryptionError('Formato de token cifrado inválido.');
        }
        const [ivB64, authTagB64, ciphertextB64] = parts;
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');
        const ciphertext = Buffer.from(ciphertextB64, 'base64');

        if (authTag.length !== AUTH_TAG_LENGTH) {
            throw new DecryptionError('Auth tag inválido.');
        }

        try {
            const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
            return decrypted.toString('utf-8');
        } catch {
            throw new DecryptionError(
                'Error al descifrar el token. Datos corruptos o clave incorrecta.',
            );
        }
    }
}

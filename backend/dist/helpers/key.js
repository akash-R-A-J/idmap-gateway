import { pool } from "../config/db.js";
export const getKeyByUserId = async (userId) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM key_schema.keys WHERE userId = $1;`, [userId]);
        return rows[0];
    }
    catch (e) {
        return null;
    }
};
//# sourceMappingURL=key.js.map
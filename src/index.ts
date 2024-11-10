import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

const client = new Client({
  connectionString: process.env.POSTGRES_URI!,
});

interface UserSchema {
  username: string;
  email: string;
  password: string;
}

interface AddressSchema {
  userId: number;
  city: string;
  state: string;
  pincode: string;
}

// Create Users Tables
const createUserTable = async () => {
  await client.connect();

  const result = await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);
  console.log(result);
};

// Create Address Tables With Foreign key
const createAddressTable = async () => {
  await client.connect();

  const result = await client.query(`
          CREATE TABLE address (
              id SERIAL PRIMARY KEY,
              userId INTEGER NOT NULL,
              city VARCHAR(255)  NOT NULL,
              state VARCHAR(255) NOT NULL,
              pincode VARCHAR(20)  NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE 
          )
      `);

  console.log(result);
};

// Creating New User
const insertUserDetails = async (user: UserSchema) => {
  await client.connect();
  const result = await client.query(
    "INSERT INTO users (username,email,password) VALUES ($1, $2,$3)",
    [user.username, user.email, user.password]
  );

  console.log(result);
};

// Creating New Address for User
const insertAddressDetails = async (address: AddressSchema) => {
  await client.connect();
  const result = await client.query(
    "INSERT INTO address (userId, city, state, pincode) VALUES ($1, $2, $3, $4)",
    [address.userId, address.city, address.state, address.pincode]
  );

  console.log(result);
};

// Get All Users
const getUserDetails = async () => {
  await client.connect();
  const result = await client.query("SELECT * FROM users");

  console.log(result.rows);
};

// Get User By Id
const getUserDetailsById = async (id: number) => {
  await client.connect();
  const result = await client.query("SELECT * FROM users WHERE id = $1", [id]);

  console.log(result.rows);
};

// update user email
const updateUserEmailDetailsById = async (id: number, email: string) => {
  await client.connect();
  const result = await client.query(
    "UPDATE users SET email = $2  WHERE id = $1;",
    [id, email]
  );

  console.log(result);
};

// delete user
const deleteUserDetailsById = async (id: number) => {
  await client.connect();
  const result = await client.query("DELETE FROM users WHERE id = $1;", [id]);

  console.log(result);
};

// JOIN - get User and its address
const getUserInfoAndAddress = async (id: number) => {
  await client.connect();
  const result = await client.query(
    `SELECT u.id, u.username, u.email, u.password, a.city, a.state, a.pincode
    FROM users u 
    JOIN address a ON u.id = a.userId 
    WHERE u.id = $1`,
    [id]
  );

  console.log(result.rows);
};

// Add new column to the user table
const createNewColumn = async () => {
  await client.connect();
  const result = await client.query(
    `ALTER TABLE users ADD balance NUMERIC(21, 2)`
  );

  console.log(result);
};

// Key Transaction Commands in PostgreSQL
// BEGIN: Starts a transaction block.
// COMMIT: Commits the current transaction block, making all changes made within the block permanent.
// ROLLBACK:

// Adding Balance to the User
const addBalance = async (id: number, amount: number) => {
  try {
    await client.connect();

    // Start a transaction
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE users SET balance = COALESCE(balance, 0) + $2 WHERE id = $1`,
      [id, amount]
    );

    // Commit the transaction
    await client.query("COMMIT");

    console.log(result);
  } catch (error) {
    // Roll back the transaction in case of an error
    await client.query("ROLLBACK");
    console.error("Transaction failed:", error);
  } finally {
    await client.end();
  }
};

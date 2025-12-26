import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export function signToken(owner) {
      return jwt.sign({
            id: owner._id,
            email: owner.email,
            shopName: owner.shopName,
            ownerName: owner.ownerName,
      }, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
      return jwt.verify(token, SECRET);
}

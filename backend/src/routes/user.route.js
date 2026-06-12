import express from "express";

const router = express.Router();

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

router.post("/friend-request", sendFriendReequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/friend-requests", sendFriendReequest);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;
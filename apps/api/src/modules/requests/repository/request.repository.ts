import { Types } from "mongoose";

import { DGReviewModel } from "../../dg-reviews/dg-review.model.js";
import { RequestModel } from "../request.model.js";
import { UserModel } from "../../users/user.model.js";
import type { RequestDgReturnGuardSource } from "../types/request.types.js";

export const requestRepository = {
  findInitialDgReviewForRequest: async (
    request: RequestDgReturnGuardSource,
  ) => {
    const reviewId = request.initialDgReviewId;

    if (reviewId) {
      return DGReviewModel.findById(reviewId).lean();
    }

    return DGReviewModel.findOne({
      requestId: request._id,
      targetType: "initial_request",
    })
      .sort({ createdAt: -1 })
      .lean();
  },

  findPortalUserById: async (actorId: string) =>
    UserModel.findById(actorId)
      .select("userType organizationId role isActive")
      .lean(),

  findOwnedRequest: async (requestId: Types.ObjectId, userId: Types.ObjectId) =>
    RequestModel.findOne({
      _id: requestId,
      submittedById: userId,
    }),

  findRequestById: async (requestId: Types.ObjectId) =>
    RequestModel.findById(requestId),

  findUsersByIds: async (actorIds: string[]) =>
    UserModel.find({ _id: { $in: actorIds } })
      .select("fullName email role userType")
      .lean(),
};

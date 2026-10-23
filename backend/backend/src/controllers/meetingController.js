const Meeting = require("../models/Meeting");
const { sendSuccess, sendError, handleError } = require("../utils/response");
const {
  isValidId,
  findAccessibleProject,
  projectUserIds
} = require("../utils/projectAccess");
const { notifyUsers } = require("../services/notificationService");

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
};

// Returns { error } or { participants } (deduplicated string ids).
// Participants must be the project's owner or members.
const validateParticipants = (participants, project) => {
  if (!Array.isArray(participants)) {
    return { error: "participants must be an array of user ids" };
  }
  if (!participants.every((p) => typeof p === "string" && isValidId(p))) {
    return { error: "participants must contain valid user ids" };
  }
  const allowed = new Set(projectUserIds(project));
  const unique = [...new Set(participants)];
  if (!unique.every((p) => allowed.has(p))) {
    return { error: "All participants must be members of the project" };
  }
  return { participants: unique };
};

const createMeeting = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, scheduledAt, participants, meetingLink, notes } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return sendError(res, 400, "Meeting title is required");
    }
    if (!scheduledAt) {
      return sendError(res, 400, "scheduledAt is required");
    }
    if (meetingLink && (typeof meetingLink !== "string" || !isHttpUrl(meetingLink))) {
      return sendError(res, 400, "meetingLink must be a valid http(s) URL");
    }

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    let participantIds = [];
    if (participants !== undefined) {
      const result = validateParticipants(participants, project);
      if (result.error) return sendError(res, 400, result.error);
      participantIds = result.participants;
    }

    const meeting = await Meeting.create({
      title,
      description,
      project: projectId,
      createdBy: req.user.userId,
      scheduledAt,
      participants: participantIds,
      meetingLink,
      notes
    });

    await notifyUsers(
      participantIds.filter((id) => id !== String(req.user.userId)),
      {
        title: "New meeting scheduled",
        message: `You were added to "${meeting.title}" in project "${project.name}"`,
        type: "meeting"
      }
    );

    return sendSuccess(res, 201, "Meeting created successfully", { meeting });
  } catch (error) {
    return handleError(res, error, "Failed to create meeting", "Invalid meeting data");
  }
};

const getProjectMeetings = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await findAccessibleProject(projectId, req.user.userId);
    if (!project) return sendError(res, 404, "Project not found");

    const meetings = await Meeting.find({ project: projectId }).sort({ scheduledAt: 1 });

    return sendSuccess(res, 200, "Meetings fetched successfully", { meetings });
  } catch (error) {
    return handleError(res, error, "Failed to fetch meetings");
  }
};

// Returns { meeting, project } or null.
const loadMeeting = async (req) => {
  const { meetingId } = req.params;
  if (!isValidId(meetingId)) return null;

  const meeting = await Meeting.findById(meetingId);
  if (!meeting) return null;

  const project = await findAccessibleProject(meeting.project, req.user.userId);
  return project ? { meeting, project } : null;
};

const getMeetingById = async (req, res) => {
  try {
    const loaded = await loadMeeting(req);
    if (!loaded) return sendError(res, 404, "Meeting not found");

    return sendSuccess(res, 200, "Meeting fetched successfully", {
      meeting: loaded.meeting
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch meeting");
  }
};

const updateMeeting = async (req, res) => {
  try {
    const loaded = await loadMeeting(req);
    if (!loaded) return sendError(res, 404, "Meeting not found");

    const { meeting, project } = loaded;
    const { title, description, scheduledAt, participants, meetingLink, notes } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return sendError(res, 400, "Meeting title cannot be empty");
      }
      meeting.title = title;
    }
    if (meetingLink !== undefined) {
      if (meetingLink && (typeof meetingLink !== "string" || !isHttpUrl(meetingLink))) {
        return sendError(res, 400, "meetingLink must be a valid http(s) URL");
      }
      meeting.meetingLink = meetingLink || "";
    }

    let newlyAdded = [];
    if (participants !== undefined) {
      const result = validateParticipants(participants, project);
      if (result.error) return sendError(res, 400, result.error);

      const before = new Set(meeting.participants.map(String));
      newlyAdded = result.participants.filter(
        (id) => !before.has(id) && id !== String(req.user.userId)
      );
      meeting.participants = result.participants;
    }

    if (description !== undefined) meeting.description = description;
    if (scheduledAt !== undefined) meeting.scheduledAt = scheduledAt;
    if (notes !== undefined) meeting.notes = notes;

    await meeting.save();

    await notifyUsers(newlyAdded, {
      title: "Added to a meeting",
      message: `You were added to "${meeting.title}" in project "${project.name}"`,
      type: "meeting"
    });

    return sendSuccess(res, 200, "Meeting updated successfully", { meeting });
  } catch (error) {
    return handleError(res, error, "Failed to update meeting", "Invalid meeting data");
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const loaded = await loadMeeting(req);
    if (!loaded) return sendError(res, 404, "Meeting not found");

    await Meeting.deleteOne({ _id: loaded.meeting._id });

    return sendSuccess(res, 200, "Meeting deleted successfully", {});
  } catch (error) {
    return handleError(res, error, "Failed to delete meeting");
  }
};

module.exports = {
  createMeeting,
  getProjectMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting
};

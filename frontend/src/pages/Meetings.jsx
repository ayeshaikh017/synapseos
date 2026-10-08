import {
  CalendarDays,
  Clock3,
  MoreHorizontal,
  Plus,
  Users,
  Video,
} from "lucide-react";

const meetings = [
  {
    id: 1,
    title: "Project Review",
    date: "Today",
    time: "3:00 PM",
    duration: "30 min",
    members: ["A", "S", "D", "S"],
    status: "upcoming",
  },
  {
    id: 2,
    title: "Sprint Planning",
    date: "Tomorrow",
    time: "11:00 AM",
    duration: "45 min",
    members: ["A", "S", "D", "S"],
    status: "upcoming",
  },
  {
    id: 3,
    title: "Backend Integration",
    date: "14 Oct",
    time: "4:00 PM",
    duration: "30 min",
    members: ["S", "D", "A"],
    status: "upcoming",
  },
];

const pastMeetings = [
  {
    title: "Weekly Team Sync",
    date: "06 Oct",
    time: "2:00 PM",
    duration: "30 min",
  },
  {
    title: "Project Kickoff",
    date: "01 Oct",
    time: "11:30 AM",
    duration: "45 min",
  },
];

function Meetings() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">
            Collaboration
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
            Meetings
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Schedule team sessions and keep project discussions organized.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus size={16} />
          Schedule meeting
        </button>
      </div>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-zinc-950">
            Upcoming
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Your next scheduled project sessions.
          </p>
        </div>

        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-300"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                    <Video size={19} className="text-zinc-700" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-950">
                        {meeting.title}
                      </h3>

                      <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-white">
                        Upcoming
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {meeting.date}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock3 size={13} />
                        {meeting.time} · {meeting.duration}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Users size={13} />
                        {meeting.members.length} participants
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="self-start rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-zinc-950">
          Recent meetings
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Previous sessions and their notes.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="divide-y divide-zinc-100">
            {pastMeetings.map((meeting) => (
              <div
                key={meeting.title}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {meeting.title}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {meeting.date} · {meeting.time} · {meeting.duration}
                  </p>
                </div>

                <button
                  type="button"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-950"
                >
                  View summary
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
            <Video size={18} className="text-zinc-700" />
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-950">
              Meeting intelligence
            </p>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Meeting notes can later be summarized and converted into
              project action items using SynapseOS AI.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Meetings;
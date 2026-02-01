/**
 * Cron jobs – release stale reservations every few minutes.
 */

import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
	"release stale reservations",
	{ minutes: 3 },
	api.sessions.releaseStaleReservations,
	{}
);

export default crons;

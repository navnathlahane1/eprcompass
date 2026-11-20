export function meetingRequestHref(source = "website", params = {}) {
  const query = new URLSearchParams({ intent: "meeting", source });

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) query.set(key, value.trim());
  }

  return `/contact?${query.toString()}`;
}

export const formatEventDateTime = (isoDateString: string) => {
  const eventDate = new Date(isoDateString);

  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'America/New_York',
  });

  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

  return {
    formattedDate,
    formattedTime,
    fullDateTime: `${formattedDate} | ${formattedTime}`,
  };
};

export const formatEventDescription = (
  datetime: string,
  description: {
    root?: { children?: Array<{ children?: Array<{ text?: string }> }> };
  },
  location: { name: string }
) => {
  const { formattedDate, formattedTime } = formatEventDateTime(datetime);
  return `${formattedDate} | ${formattedTime} | ${description?.root?.children?.[0]?.children?.[0]?.text} | ${location.name}`;
};

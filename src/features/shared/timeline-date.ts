/** Format an ISO calendar date without converting it to the viewer's timezone. */
export function timelineDisplayDate(isoDate:string):string {
  const [year,month,day]=isoDate.split("-");
  return `${day}/${month}/${year}`;
}

import { format } from "date-fns";
import { ProfileData } from "../elements/profile";
import { lightenColor, parseColor } from "../utils/color-manipulation";

let joiningDate = 0;
let calendar = $(".calendar") as JQuery<HTMLElement>;
let yearDropdown = $(".year-dropdown");
let previousSelectedYear = new Date().getFullYear();

const yearDropdownClick = (): void => {
  yearDropdown.find(".list").toggleClass("hidden");
};
const yearClick = (event: JQuery.ClickEvent): void => {
  if (event.target.tagName === "SPAN") {
    const year = event.target.innerText;
    // First Remove check icon and active class from last selected year
    if (previousSelectedYear) {
      yearDropdown.find(`.${previousSelectedYear}`).removeClass("active");
      yearDropdown
        .find(`.${previousSelectedYear}`)
        .html(`${previousSelectedYear}`);
    }

    updateYearDropdown(parseInt(year, 10));
    clearCalendar();
    updateCalendarHeader(parseInt(year, 10), 0, 0, 0);

    for (let i = 1; i <= 12; i++) {
      createCalendar(calendar, parseInt(year, 10), i, joiningDate);
    }

    previousSelectedYear = parseInt(year);
    return;
  }
  event.stopPropagation();
};

function clearCalendar(): void {
  calendar.find(`.year-table`).remove();
}

function createTableElement(
  week: { [key: string]: string },
  month: number,
  months: string[],
  year: number
): string {
  // Create table element
  const table = `<table class="year-table" attr='table-${year}'>
                  <tr> <td></td> </tr>
                  <tr>
                    ${week["monday"]}
                  </tr>
                  <tr>
                    ${week["tuesday"]}
                  </tr>
                  <tr>
                    ${week["wednesday"]}
                  </tr>
                  <tr>
                    ${week["thursday"]}
                  </tr>
                  <tr>
                    ${week["friday"]}
                  </tr>
                  <tr>
                    ${week["saturday"]}
                  </tr>
                  <tr>
                    ${week["sunday"]}
                  </tr>
                  <tr>
                    <th class="month" colspan="7">${months[month]}</th>  
                  </tr>
              </table>`;
  return table;
}

function createCalendar(
  element: JQuery<HTMLElement>,
  year: number,
  month: number,
  joiningDate = 0
): void {
  if (!element) return;
  month = month - 1; // months in JS are 0..11, not 1..12
  const date = new Date(year, month);
  const joinedIn = new Date(joiningDate);

  const days: string[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const week: { [key: string]: string } = {
    monday: ``,
    tuesday: ``,
    wednesday: ``,
    thursday: ``,
    friday: ``,
    saturday: ``,
    sunday: ``,
  };

  const months: string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Spaces for the first column
  // from Monday till the first day of the month
  // * * * 1  2  3  4
  for (let i = 0; i < getDay(date); i++) {
    week[days[i]] += "<td></td>";
  }

  // <td> with actual dates
  while (date.getMonth() == month) {
    const day = getDay(date);
    const isJanuary = date.getMonth() === 0;
    const isDecember = date.getMonth() === 11;
    const balloonPosition = isJanuary ? "right" : isDecember ? "left" : "up";
    const isJoiningDate =
      date.getMonth() === joinedIn.getMonth() &&
      date.getDate() === joinedIn.getDate() &&
      date.getFullYear() === joinedIn.getFullYear();

    const bgColor = yearDropdown.find(".selected").css("background-color");

    let balloonText = `- contribution on ${
      months[month]
    }  ${date.getDate()}, ${year}`;
    if (isJoiningDate) {
      balloonText = `Joined ${
        months[month]
      }  ${date.getDate()}, ${year} \n - contribution`;
    }
    const contributionLevel = isJoiningDate ? 4 : 0;

    // Parse the color value
    const color = parseColor(bgColor);

    // Manipulate the color (for example, make it lighter)
    const lighterColor = lightenColor(
      color,
      (100 / 4) * contributionLevel // 25, 50, 75, 100
    );

    const rgba = `rgba(${lighterColor.r}, ${lighterColor.g}, ${lighterColor.b}, ${lighterColor.a})`;

    const td = `<td aria-label='${balloonText}' ${
      isJoiningDate ? `data-balloon-length='large' data-balloon-break` : ""
    } data-balloon-pos='${balloonPosition}' class='${
      isJoiningDate ? "joiningDay" : ""
    } calendar-day' data-level='${contributionLevel}' ${
      contributionLevel !== 0 ? `style='background-color: ${rgba}'` : ""
    }  ></td>`;

    week[days[day]] += td;
    date.setDate(date.getDate() + 1);
  }

  // add spaces after last days of month for the last column
  // 29 30 31 * * * *
  if (getDay(date) != 0) {
    for (let i = getDay(date); i < 7; i++) {
      week[days[i]] += "<td></td>";
    }
  }

  element.append(createTableElement(week, month, months, year));
}

function getDay(date: Date): number {
  // get day number from 0 (monday) to 6 (sunday)
  let day = date.getDay();
  if (day == 0) day = 7; // make Sunday (0) the last day
  return day - 1;
}

function updateCalendarHeader(
  year: number,
  contributionValue: number,
  totalActiveDays: number,
  maxStreak: number
): void {
  const contributionActivityHeader = $(".contribution-activity").find(
    ".header"
  );
  contributionActivityHeader.find(".group1 .value").text(contributionValue);
  contributionActivityHeader.find(".group1 .year").text(year);

  contributionActivityHeader
    .find(".group2 .total-active .days")
    .text(totalActiveDays);
  contributionActivityHeader.find(".group2 .max-streak .days").text(maxStreak);
}

function updateYearDropdown(year: number): void {
  yearDropdown.find(`.${year}`).addClass("active");
  yearDropdown
    .find(`.${year}`)
    .html(`${year} <i class="fas fa-solid fa-check"></i>`);
  yearDropdown
    .find(".selected")
    .html(`${year} <i class="fas fa-chevron-down"></i>`);
}

export function update(
  snapshot: Partial<ProfileData> | null,
  isProfile: boolean
): void {
  // unbind previous click event
  yearDropdown.off("click", yearDropdownClick);
  yearDropdown.find(".list").off("click", yearClick);

  const source = isProfile ? "Profile" : "Account";
  calendar = $(`.page${source} .profile .calendar`);
  yearDropdown = $(`.page${source} .profile .year-dropdown`);
  const currentYear = new Date().getFullYear();
  previousSelectedYear = currentYear;
  // Clear previous calendar if any
  clearCalendar();

  // bind events again
  yearDropdown.on("click", yearDropdownClick);
  yearDropdown.find(".list").on("click", yearClick);

  const profile = snapshot;
  const joiningYear = profile
    ? parseInt(format(profile?.addedAt ?? 0, "yyyy"), 10)
    : 2021;

  joiningDate = profile?.addedAt ?? 0;

  // Remove span(years) tags from year dropdown
  yearDropdown.find(".list").html("");
  // Add years in dropdown
  for (let year = joiningYear; year <= currentYear; year++) {
    const span = $(`<span class='${year}'>${year}</span>`);
    yearDropdown.find(".list").prepend(span);
  }

  updateYearDropdown(previousSelectedYear);
  updateCalendarHeader(previousSelectedYear, 0, 0, 0);

  for (let i = 1; i <= 12; i++) {
    createCalendar(calendar, previousSelectedYear, i, joiningDate);
  }
}

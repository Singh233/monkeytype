import { format } from "date-fns";
import { ProfileData } from "../elements/profile";
import { lightenColor, parseColor } from "../utils/color-manipulation";
import { showConfetti } from "../test/result";

interface ContributionDetails {
  [year: string]: {
    [date: string]: number;
  };
}

interface BalloonZones {
  [zone: string]: string;
}

let joiningDate = 0;
let calendar = $(".calendar") as JQuery<HTMLElement>;
let yearDropdown = $(".year-dropdown");
let previousSelectedYear = new Date().getFullYear();
let contributionDetails: ContributionDetails = {};
let maxStreak = 0;
const balloonZones: BalloonZones = {
  1: "up-left",
  2: "down-left",
  3: "down",
  4: "down-right",
  5: "up-right",
  6: "up",
};

const calendarMouseOutCallback = (event: JQuery.ClickEvent): void => {
  if (
    event.target.tagName === "TD" &&
    $(event.target).attr("data-balloon-pos") !== undefined
  ) {
    const calendarDay = $(event.target);
    calendarDay.removeAttr("data-balloon-pos");
  }
};

const calendarMouseOverCallback = (event: JQuery.ClickEvent): void => {
  if (
    event.target.tagName === "TD" &&
    $(event.target).attr("data-balloon-zone") !== undefined
  ) {
    const x = event.target.getBoundingClientRect().x;
    const calendarDay = $(event.target);
    const zone = calendarDay.attr("data-balloon-zone") ?? "6";
    // Right offset
    if (x + 250 >= window.innerWidth) {
      calendarDay.attr(
        "data-balloon-pos",
        parseInt(zone) >= 5 ? balloonZones[5] : balloonZones[4]
      );
    } else if (x - 250 <= 0) {
      // Left offset
      calendarDay.attr(
        "data-balloon-pos",
        parseInt(zone) === 1 || parseInt(zone) === 6
          ? balloonZones[1]
          : balloonZones[2]
      );
    } else {
      calendarDay.attr("data-balloon-pos", balloonZones[zone]);
    }

    let label = calendarDay.attr("aria-label");
    if (window.innerWidth <= 600) {
      label = label?.replace("contributions", "tests");
      label = label?.replace("contribution", "test");
    } else {
      label = label?.replace("tests", "contributions");
      label = label?.replace("test", "contribution");
    }
    calendarDay.attr("aria-label", label ?? "Something went wrong!");
  }
};

const yearDropdownClickCallback = (): void => {
  yearDropdown.find(".list").toggleClass("hidden");
};

const yearClickCallback = (event: JQuery.ClickEvent): void => {
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
    updateCalendarHeader(
      parseInt(year, 10),
      contributionDetails["totalContributions"]?.["value"] ?? 0,
      contributionDetails[year]?.["totalContributions"] ?? 0,
      contributionDetails[year]?.["activeDays"] ?? 0,
      contributionDetails["totalActiveDays"]?.["value"] ?? 0,
      maxStreak
    );

    for (let i = 1; i <= 12; i++) {
      createCalendar(calendar, parseInt(year, 10), i, joiningDate);
    }
    calendar.find(".joiningDay").off({
      mouseover: easterEgg,
      click: easterEgg,
    });

    removeCalendarEvents();
    addCalendarEvents();

    previousSelectedYear = parseInt(year);
    return;
  }
  event.stopPropagation();
};

const easterEgg = (event: JQuery.ClickEvent): void => {
  showConfetti();
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
  joiningDate = 0,
  isPreload = false
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
    if (isPreload) {
      const td = `<td class='calendar-day' data-level='0'></td>`;
      week[days[day]] += td;
      date.setDate(date.getDate() + 1);
      continue;
    }
    const balloonLeftOffset = date.getMonth() === 0 || date.getMonth() === 1;
    const balloonRightOffset = date.getMonth() === 11 || date.getMonth() === 10;
    const balloonTopOffset = day <= 1;
    const balloonZone = balloonLeftOffset
      ? `${balloonTopOffset ? 2 : 1}`
      : balloonRightOffset
      ? `${balloonTopOffset ? 4 : 5}`
      : `${balloonTopOffset ? 3 : 6}`;
    const isJoiningDate =
      date.getMonth() === joinedIn.getMonth() &&
      date.getDate() === joinedIn.getDate() &&
      date.getFullYear() === joinedIn.getFullYear();

    const bgColor = yearDropdown.find(".selected").css("background-color");

    const contributionYear = contributionDetails[date.getFullYear()];
    const contributionDayAndMonth = `${
      date.getDate() > 10 ? date.getDate() : `0${date.getDate()}`
    } ${months[month]}`;

    const contributionCount = contributionYear?.[contributionDayAndMonth] ?? 0;
    const contributionLevel = isJoiningDate
      ? 4
      : Math.ceil(contributionCount / 4);

    let balloonText = `${contributionCount} contribution${
      contributionCount > 1 || contributionCount === 0 ? "s" : ""
    } on ${months[month]}  ${date.getDate()}, ${year}`;

    if (isJoiningDate) {
      balloonText = `Joined ${
        months[month]
      }  ${date.getDate()}, ${year} \n ${contributionCount} contribution${
        contributionCount > 1 || contributionCount === 0 ? "s" : ""
      }`;
    }

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
    }  class='${
      isJoiningDate ? "joiningDay" : ""
    } calendar-day' data-balloon-zone='${balloonZone}' data-level='${contributionLevel}' ${
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
  totalContributions = 0,
  contributionYearly = 0,
  activeDays = 0,
  totalActiveDays = 0,
  maxStreak = 0
): void {
  const contributionActivityHeader = calendar.parent().parent().find(".header");

  contributionActivityHeader
    .find(".title")
    .attr(
      "aria-label",
      `Total contribution${
        totalContributions > 1 || totalContributions === 0 ? "s" : ""
      } - ${totalContributions}`
    );
  contributionActivityHeader.find(".group1 .value").text(contributionYearly);
  contributionActivityHeader
    .find(".group1 p")
    .text(
      contributionYearly > 1 || contributionYearly === 0
        ? "contributions in"
        : "contribution in"
    );
  contributionActivityHeader.find(".group1 .year").text(year);

  contributionActivityHeader
    .find(".group2 .total-active .days")
    .text(activeDays);
  contributionActivityHeader
    .find(".group2 .total-active")
    .attr(
      "aria-label",
      `Total active day${
        totalActiveDays > 1 || totalActiveDays === 0 ? "s" : ""
      } - ${totalActiveDays}`
    );
  contributionActivityHeader
    .find(".group2 .max-streak .days")
    .text(
      `${
        maxStreak > 1 || maxStreak === 0
          ? `${maxStreak} days`
          : `${maxStreak} day`
      }`
    );
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
  profile: Partial<ProfileData> | null,
  isProfile: boolean
): void {
  maxStreak = profile?.maxStreak ?? 0;
  // unbind previous click event because there are two seperate pages one for profile and another for account
  // and both have same class names
  yearDropdown.off("click", yearDropdownClickCallback);
  yearDropdown.find(".list").off("click", yearClickCallback);
  removeCalendarEvents();

  const source = isProfile ? "Profile" : "Account";
  calendar = $(`.page${source} .profile .calendar`);
  yearDropdown = $(`.page${source} .profile .year-dropdown`);
  const currentYear = new Date().getFullYear();
  previousSelectedYear = currentYear;

  // Clear previous calendar if any
  clearCalendar();

  evaluateContributions(profile);

  // bind events again
  yearDropdown.on("click", yearDropdownClickCallback);
  yearDropdown.find(".list").on("click", yearClickCallback);

  const joiningYear = profile
    ? parseInt(format(profile?.addedAt ?? 0, "yyyy"), 10)
    : 2020;

  joiningDate = profile?.addedAt ?? 0;

  // Remove span(years) tags from year dropdown
  yearDropdown.find(".list").html("");
  // Add years in dropdown
  for (let year = joiningYear; year <= currentYear; year++) {
    const span = $(`<span class='${year}'>${year}</span>`);
    yearDropdown.find(".list").prepend(span);
  }

  updateYearDropdown(previousSelectedYear);
  updateCalendarHeader(
    previousSelectedYear,
    contributionDetails["totalContributions"]?.["value"] ?? 0,
    contributionDetails[previousSelectedYear]?.["totalContributions"] ?? 0,
    contributionDetails[previousSelectedYear]?.["activeDays"] ?? 0,
    contributionDetails["totalActiveDays"]?.["value"] ?? 0,
    profile?.maxStreak
  );

  for (let i = 1; i <= 12; i++) {
    // per month
    createCalendar(calendar, previousSelectedYear, i, joiningDate);
  }

  addCalendarEvents();
}

function evaluateContributions(profile: Partial<ProfileData> | null): void {
  if (!profile?.results) {
    return;
  }

  // Create an object to store contributions by year
  contributionDetails = {
    totalContributions: { value: 0 },
    totalActiveDays: { value: 0 },
  };

  // Iterate through contributions and count them by date
  for (const contribution of profile.results) {
    const date = new Date(contribution.timestamp);
    const dayAndMonth = format(date, "dd MMM");
    const year = format(date, "yyyy");

    // Initialize the year if it doesn't exist in contributionDetails
    if (!contributionDetails[year]) {
      contributionDetails[year] = {};
    }

    // Initialize the dayAndMonth if it doesn't exist in the year
    if (!contributionDetails[year][dayAndMonth]) {
      contributionDetails[year][dayAndMonth] = 0;
    }

    // Initialize the totalContributions if it doesn't exist in the year
    if (!contributionDetails[year]["totalContributions"]) {
      contributionDetails[year]["totalContributions"] = 0;
    }

    // Increment contributions for the specific day and month
    contributionDetails[year][dayAndMonth]++;

    // Increment totalContributions
    contributionDetails["totalContributions"]["value"]++;

    // Increment totalContributions of a particular year
    contributionDetails[year]["totalContributions"]++;
  }

  // Calculate totalActiveDays and activeDays for each year
  Object.entries(contributionDetails).forEach(([key, value]) => {
    if (key === "totalActiveDays" || key === "totalContributions") return;
    const length = Object.keys(value).length;
    contributionDetails["totalActiveDays"]["value"] += length - 1;
    contributionDetails[key]["activeDays"] = length - 1;
  });
}

export const preloadCalendar = (): void => {
  for (let month = 1; month <= 12; month++) {
    createCalendar(
      $(`.pageProfile .profile .calendar`),
      new Date().getFullYear(),
      month,
      0,
      true
    );
  }
};

const addCalendarEvents = (): void => {
  calendar.find(".joiningDay").on({
    mouseover: easterEgg,
    click: easterEgg,
  });

  calendar.on({
    mouseover: calendarMouseOverCallback,
    mouseout: calendarMouseOutCallback,
  });
};

const removeCalendarEvents = (): void => {
  calendar.find(".joiningDay").off({
    mouseover: easterEgg,
    click: easterEgg,
  });
  calendar.off({
    mouseover: calendarMouseOverCallback,
    mouseout: calendarMouseOutCallback,
  });
};

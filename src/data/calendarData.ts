import { CalendarEvent } from '../types';

export const UITM_FALLBACK_CALENDAR_TEXT = `
=========================================
UITM CANONICAL ACADEMIC CALENDAR REFERENCE
=========================================

--- GROUPS / STATES IN UITM ---
UiTM operates branches across Malaysia, divided into two academic calendar groups:
- GROUP A (States: Kedah, Johor, Kelantan, Terengganu):
  * The academic week starts on Sunday and ends on Thursday.
  * Weekend rests on Friday and Saturday.
- GROUP B (States: Selangor/Shah Alam campus, Melaka, Negeri Sembilan, Pahang, Perak, Perlis, Pulau Pinang, Sabah, Sarawak, Kuala Lumpur, Putrajaya, Labuan):
  * The academic week starts on Monday and ends on Friday.
  * Weekend rests on Saturday and Sunday.

--- ACADEMIC YEAR 2025/2026 ---
* ACTIVE SEMESTER: SEMESTER II (MARCH 2026 - AUGUST 2026) [Current Ongoing Semester]
  - Student self-registration (new intake/transfers): 20 - 22 March 2026
  - Course Registration (all students): 23 March 2026 - 12 April 2026 (Weeks 1 to 3 of semester)
  - Special Add/Drop of Course Period: 13 April 2026 - 19 April 2026
  - Lectures Part 1: 23 March 2026 - 10 May 2026 (7 Weeks)
  - Mid-Semester Break (Cuti Pertengahan Semester): 11 May 2026 - 17 May 2026 (1 Week)
  - Lectures Part II: 18 May 2026 - 5 July 2026 (7 Weeks)
  - Revision Period (Minggu Ulangkaji): 6 July 2026 - 12 July 2026 (1 Week)
  - Final Assessment / Examinations (Penilaian/Peperiksaan Akhir): 13 July 2026 - 2 August 2026 (3 Weeks)
  - End of Semester Break (Cuti Semester): 3 August 2026 - 4 October 2026 (9 Weeks of long break)

* UPCOMING SEMESTER: SEMESTER I (OCTOBER 2026 - MARCH 2027) [Next Academic Session]
  - New Intake Intake/Transfer Student Registration: 25 - 27 September 2026
  - Course Registration Period: 5 October 2026 - 25 October 2026
  - Special Add/Drop of Course Period: 26 October 2026 - 1 November 2026
  - Lectures Part I: 5 October 2026 - 22 November 2026 (7 Weeks)
  - Mid-Semester Break (Cuti Pertengahan Semester): 23 November 2026 - 29 November 2026 (1 Week)
  - Lectures Part II: 30 November 2026 - 17 January 2027 (7 Weeks)
  - Revision Period (Minggu Ulangkaji): 18 January 2027 - 24 January 2027 (1 Week)
  - Final Assessment / Examinations (Penilaian/Peperiksaan Akhir): 25 January 2027 - 14 February 2027 (3 Weeks)
  - End of Semester Break (Cuti Semester): 15 February 2027 - 21 March 2027 (5 Weeks)

* PREVIOUS SEMESTER: SEMESTER I (OCTOBER 2025 - FEBRUARY 2026) [Completed]
  - New Intake Student Registration: 3 - 5 October 2025
  - Course Registration Period: 6 October 2025 - 26 October 2025
  - Lectures Part I: 6 October 2025 - 23 November 2025 (7 Weeks)
  - Mid-Semester Break (Cuti Pertengahan Semester): 24 November 2025 - 30 November 2025 (1 Week)
  - Lectures Part II: 1 December 2025 - 18 January 2026 (7 Weeks)
  - Revision Period: 19 January 2026 - 25 January 2026 (1 Week)
  - Final Assessments / Examinations: 26 January 2026 - 15 February 2026 (3 Weeks)
  - End of Semester Break: 16 February 2026 - 22 March 2026 (5 Weeks)

--- CRITICAL UNIVERSITY ADVISORY & MILESTONES ---
- First Day of Lecture:
  * For Group A: Students start lectures 1 day earlier than Group B (Sunday instead of Monday).
  * Example for March-August 2026: Group A starts lectures on March 22, 2026. Group B starts on March 23, 2026.
- Inactive Status/Deferments (Tangguh Pengajian):
  * Applications for deferment must typically be made by the fourth week of lectures (specifically Weeks 1-4).
- Grade Release Dates:
  * Exam result publications are generally announced about 3 to 4 weeks after the final day of the examination period. For the current Semester 2 2025/2026, exam results will likely be published in late August or early September 2026.
`;

export const CANONICAL_EVENTS: CalendarEvent[] = [
  // Semester 2, 2025/2026
  {
    id: 's2_reg_all',
    eventName: 'Course Registration (All Students)',
    startDate: '2026-03-23',
    endDate: '2026-04-12',
    category: 'registration',
    semester: 'Semester II (March - August 2026)',
    groupA: 'March 22 - April 11, 2026',
    groupB: 'March 23 - April 12, 2026',
    description: 'Self-course registration via student portal (uitm.edu.my Student Portal).'
  },
  {
    id: 's2_lect_1',
    eventName: 'Lectures Part I',
    startDate: '2026-03-23',
    endDate: '2026-05-10',
    category: 'lecture',
    semester: 'Semester II (March - August 2026)',
    groupA: 'March 22 - May 09, 2026',
    groupB: 'March 23 - May 10, 2026',
    description: 'First half of the academic semester consisting of 7 weeks of classes.'
  },
  {
    id: 's2_mid_break',
    eventName: 'Mid-Semester Break',
    startDate: '2026-05-11',
    endDate: '2026-05-17',
    category: 'break',
    semester: 'Semester II (March - August 2026)',
    groupA: 'May 10 - May 16, 2026',
    groupB: 'May 11 - May 17, 2026',
    description: 'Intermission week for students and faculty alike.'
  },
  {
    id: 's2_lect_2',
    eventName: 'Lectures Part II',
    startDate: '2026-05-18',
    endDate: '2026-07-05',
    category: 'lecture',
    semester: 'Semester II (March - August 2026)',
    groupA: 'May 17 - July 04, 2026',
    groupB: 'May 18 - July 05, 2026',
    description: 'Second half of the academic semester consisting of 7 weeks of classes.'
  },
  {
    id: 's2_revision',
    eventName: 'Revision Week',
    startDate: '2026-07-06',
    endDate: '2026-07-12',
    category: 'break',
    semester: 'Semester II (March - August 2026)',
    groupA: 'July 05 - July 11, 2026',
    groupB: 'July 06 - July 12, 2026',
    description: 'No lectures held; dedicated weeks for students to prepare for assessments.'
  },
  {
    id: 's2_exams',
    eventName: 'Final Examination / Assessments',
    startDate: '2026-07-13',
    endDate: '2026-08-02',
    category: 'exam',
    semester: 'Semester II (March - August 2026)',
    groupA: 'July 12 - August 01, 2026',
    groupB: 'July 13 - August 02, 2026',
    description: 'Three weeks allocated for the final papers, exams, and assessments.'
  },
  {
    id: 's2_sem_break',
    eventName: 'End of Semester Break',
    startDate: '2026-08-03',
    endDate: '2026-10-04',
    category: 'break',
    semester: 'Semester II (March - August 2026)',
    groupA: 'August 02 - October 03, 2026',
    groupB: 'August 03 - October 04, 2026',
    description: 'Long holiday period before the start of the next academic year sessions.'
  },

  // Semester 1, 2026/2027
  {
    id: 's1_reg_all',
    eventName: 'Course Registration (All Students)',
    startDate: '2026-10-05',
    endDate: '2026-10-25',
    category: 'registration',
    semester: 'Semester I (October 2026 - March 2027)',
    groupA: 'October 04 - October 24, 2026',
    groupB: 'October 05 - October 25, 2026',
    description: 'Self-course registration via standard portal for the new academic year session.'
  },
  {
    id: 's1_lect_1',
    eventName: 'Lectures Part I',
    startDate: '2026-10-05',
    endDate: '2026-11-22',
    category: 'lecture',
    semester: 'Semester I (October 2026 - March 2027)',
    groupA: 'October 04 - November 21, 2026',
    groupB: 'October 05 - November 22, 2026',
    description: 'First half of lectures for Semester 1 (7 weeks).'
  },
  {
    id: 's1_mid_break',
    eventName: 'Mid-Semester Break',
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    category: 'break',
    semester: 'Semester I (October 2026 - March 2027)',
    groupA: 'November 22 - November 28, 2026',
    groupB: 'November 23 - November 29, 2026',
    description: 'One-week interim recess for Semester 1.'
  },
  {
    id: 's1_lect_2',
    eventName: 'Lectures Part II',
    startDate: '2026-11-30',
    endDate: '2027-01-17',
    category: 'lecture',
    semester: 'Semester I (October 2026 - March 2027)',
    groupA: 'November 29, 2026 - January 16, 2027',
    groupB: 'November 30, 2026 - January 17, 2027',
    description: 'Concluding 7 weeks of lectures.'
  },
  {
    id: 's1_revision',
    eventName: 'Revision Week',
    startDate: '2027-01-18',
    endDate: '2027-01-24',
    category: 'break',
    semester: 'Semester I (October 2026 - March 2027)',
    groupA: 'January 17 - January 23, 2027',
    groupB: 'January 18 - January 24, 2027',
    description: 'Dedicated study period before final assessments begin.'
  },
  {
    id: 's1_exams',
    eventName: 'Final Examination / Assessments',
    startDate: '2027-01-25',
    endDate: '2027-02-14',
    category: 'exam',
    semester: 'Semester I (October 2026 - March 2027)',
    groupA: 'January 24 - February 13, 2027',
    groupB: 'January 25 - February 14, 2027',
    description: 'Three weeks allocated for the final exams and assessment papers.'
  },
  {
    id: 's1_sem_break',
    eventName: 'End of Semester Break',
    startDate: '2027-02-15',
    endDate: '2027-03-21',
    category: 'break',
    semester: 'Semester I (October 2026 - March 2027)',
    groupA: 'February 14 - March 20, 2027',
    groupB: 'February 15 - March 21, 2027',
    description: 'Break period of 5 weeks for students before the upcoming semester phase.'
  }
];

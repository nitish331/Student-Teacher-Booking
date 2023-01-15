const Interview = require("../models/interview");
const Student = require("../models/student");

// renders the addInterview page
module.exports.addInterview = (req, res) => {
  if (req.isAuthenticated()) {
    return res.render("add_interview", {
      title: "Schedule An Interview",
    });
  }

  return res.redirect("/");
};

// creating a new interview
module.exports.create = async (req, res) => {
  try {
    const { teacher, date } = req.body;

    await Interview.create(
      {
        teacher,
        date,
      },
      (err, Interview) => {
        if (err) {
          return res.redirect("back");
        }
        return res.redirect("back");
      }
    );
  } catch (err) {
    console.log(err);
  }
};

// Enrolling student in the interview
module.exports.enrollInInterview = async (req, res) => {
  try {
    let interview = await Interview.findById(req.params.id);
    const { email, result } = req.body;

    if (interview) {
      let student = await Student.findOne({ email: email });
      if (student) {
        // check if already enrolled
        let alreadyEnrolled = await Interview.findOne({
          "students.student": student.id,
        });

        // preventing student from enrolling in same teacher more than once
        if (alreadyEnrolled) {
          if (alreadyEnrolled.teacher === interview.teacher) {
            req.flash(
              "error",
              `${student.name} already enrolled with ${interview.teacher} interview!`
            );
            return res.redirect("back");
          }
        }

        let studentObj = {
          student: student.id,
          result: result,
        };

        // updating students field of interview by putting reference of newly enrolled student
        await interview.updateOne({
          $push: { students: studentObj },
        });

        // updating interview of student
        let assignedInterview = {
          teacher: interview.teacher,
          date: interview.date,
          result: result,
        };
        await student.updateOne({
          $push: { interviews: assignedInterview },
        });

        console.log(
          "success",
          `${student.name} enrolled with ${interview.teacher} interview!`
        );
        return res.redirect("back");
      }
      return res.redirect("back");
    }
    return res.redirect("back");
  } catch (err) {
    console.log("error", "Error in enrolling interview!");
  }
};

// deallocating students from an interview
module.exports.deallocate = async (req, res) => {
  try {
    const { studentId, interviewId } = req.params;

    // find the interview
    const interview = await Interview.findById(interviewId);

    if (interview) {
      // remove reference of student from interview schema
      await Interview.findOneAndUpdate(
        { _id: interviewId },
        { $pull: { students: { student: studentId } } }
      );

      // remove interview from student's schema using interview's company
      await Student.findOneAndUpdate(
        { _id: studentId },
        { $pull: { interviews: { teacher: interview.teacher } } }
      );
      return res.redirect("back");
    }
    return res.redirect("back");
  } catch (err) {
    console.log("error", "Couldn't deallocate from interview");
  }
};

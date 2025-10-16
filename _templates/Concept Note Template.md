---
type: concept
tags: concept
course: <%*
// Define all possible courses
const allCourses = [
  "Fundamentos de la Programacion",
  "Matemáticas",
  "Introducción a la Ciberseguridad",
  "Pensamiento Social Cristiano",
  "Inglés I"
];

// Get the context from the folder, if it exists
const context = await tp.user.getUniversityContext(tp.config.target_file);
const suggestedCourse = context?.subject;

let finalCourses = allCourses;

// If the suggested course is valid and exists in our list, move it to the top
if (suggestedCourse && suggestedCourse !== "General" && allCourses.includes(suggestedCourse)) {
  finalCourses = [suggestedCourse, ...allCourses.filter((course) => course !== suggestedCourse)];
}

// Show the suggester, with the best guess pre-selected at the top
tR += await tp.system.suggester(finalCourses, finalCourses);
%>
---

# 💡 <% tp.file.title %>

## 📜 Definition
*A formal, textbook-style definition of the concept.*
- <% tp.file.cursor() %>

## 🧠 Analogy or Metaphor
*How can I explain this concept using a simple, real-world analogy?*
- 

## 🧭 Explanation in My Own Words
*The Feynman Technique: Explaining it simply to prove I understand it.*
- 

---

## 🔗 Connections
*This concept is mentioned in the following lectures and notes:*

```dataview
LIST FROM [[<% tp.file.title %>]] AND #lecture
SORT file.ctime ASC
```

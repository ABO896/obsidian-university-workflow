---
type: concept
tags: [concept]
course: <%*
const allCourses = [
  "Fundamentos de la Programacion",
  "Matemáticas",
  "Introducción a la Ciberseguridad",
  "Pensamiento Social Cristiano",
  "Inglés I",
];

const context = await tp.user.getUniversityContext(tp.config.target_file);
const suggestedCourse = context?.subject;

let finalCourses = allCourses;
if (suggestedCourse && suggestedCourse !== "General" && allCourses.includes(suggestedCourse)) {
  finalCourses = [suggestedCourse, ...allCourses.filter((course) => course !== suggestedCourse)];
}

const selection = await tp.system.suggester(finalCourses, finalCourses);
tR += `${selection ?? "General"}`;
%>
status: draft
---

# 💡 <% tp.file.title %>

## 📜 Definition
*A formal, textbook-style definition of the concept.*
- <% tp.file.cursor() %>

## 🧠 Analogy or Metaphor
*How can I explain this concept using a simple, real-world analogy?*
- [ ] Analogy

## 🧭 Explanation in My Own Words
*The Feynman Technique: Explaining it simply to prove I understand it.*
- [ ] Insight

---

## 🔗 Connections
*This concept is mentioned in the following lectures and notes:*

```dataview
LIST FROM [[<% tp.file.title %>]] AND #lecture
SORT file.ctime ASC
```

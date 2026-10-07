import CrudPage from "../../../shared/components/CrudPage";

export default function Subjects() {
  return (
    <CrudPage
      title="Subjects"
      description="Create the subject master records used by standards, staff assignments and timetables."
      endpoint="/subjects"
      fields={[
        {
          name: "code",
          label: "Code",
          help: "Unique subject code, for example CS101."
        },
        {
          name: "name",
          label: "Name",
          help: "Subject name, for example Computer Science."
        },
        {
          name: "credits",
          label: "Credits",
          type: "number",
          required: false,
          min: 0,
          help: "Enter a whole number. Leave blank if credits are not applicable."
        }
      ]}
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "credits", label: "Credits" }
      ]}
      createLabel="Subject"
    />
  );
}

import mongoose from "mongoose";
import { Readable } from "stream";
import Contact from "../../src/schemas/Contact";
import Tag from "../../src/schemas/Tag";
import ImportContactsService from "../../src/services/ImportContactsService";

describe("Import", () => {
  beforeAll(async () => {
    if (!process.env.MONGO_URL) {
      throw new Error("MongoDB server not initialized");
    }

    await mongoose.connect(process.env.MONGO_URL);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Contact.deleteMany({});
    await Tag.deleteMany({});
  });

  it("should be able to import new contacts", async () => {
    const contactsFileStream = Readable.from([
      "viniciussvl@hotmail.com\n",
      "aquino@hotmail.com\n",
      "vinicius.aquino@hotmail.com\n",
    ]);

    const importContacts = new ImportContactsService();

    await importContacts.run(contactsFileStream, ["Students", "Class A"]);

    const createdTags = await Tag.find({}).lean();

    expect(createdTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: "Students" }),
        expect.objectContaining({ title: "Class A" }),
      ])
    );

    const createdTagsIds = createdTags.map((tag) => tag._id);

    const createdContacts = await Contact.find({}).lean();

    expect(createdContacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: "viniciussvl@hotmail.com",
          tags: createdTagsIds,
        }),
        expect.objectContaining({
          email: "aquino@hotmail.com",
          tags: createdTagsIds,
        }),
        expect.objectContaining({
          email: "vinicius.aquino@hotmail.com",
          tags: createdTagsIds,
        }),
      ])
    );
  });

  it("should not recreate tags that already exists", async () => {
    const contactsFileStream = Readable.from([
      "viniciussvl@hotmail.com\n",
      "aquino@hotmail.com\n",
      "vinicius.aquino@hotmail.com\n",
    ]);

    const importContacts = new ImportContactsService();

    await Tag.create({ title: "Students" });

    await importContacts.run(contactsFileStream, ["Students", "Class A"]);

    const createdTags = await Tag.find({}).lean();

    expect(createdTags).toEqual([
      expect.objectContaining({ title: "Students" }),
      expect.objectContaining({ title: "Class A" }),
    ]);
  });
});

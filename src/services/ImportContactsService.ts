import { Readable } from "stream";
import { parse } from "csv-parse";
import Contact from "@schemas/Contact";
import Tag from "@schemas/Tag";

class ImportContactsService {
  private tagsIds: string[];

  constructor() {
    this.tagsIds = [];
  }

  async run(contactsFileStream: Readable, tags: string[]): Promise<void> {
    const parsers = parse({
      delimiter: ";",
    });

    const parseCsv = contactsFileStream.pipe(parsers);

    parseCsv.on("data", async (line) => {
      console.log(line);
      const [email] = line;

      await this.createTags(tags);
      await this.createContact(email);
    });

    await new Promise((resolve) => parseCsv.on("end", resolve));
  }

  private async createTags(tags: string[]) {
    const newTags = await this.getTagsThatDontExists(tags);
    const createdTags = await Tag.create(newTags);
    this.tagsIds = await this.mapTagsById(createdTags);
  }

  private async getTagsThatDontExists(tags: string[]) {
    const existentTags = await Tag.find({
      title: {
        $in: tags,
      },
    });

    const existentTagsTitles = existentTags.map((tag: any) => tag.title);
    const newTags = tags
      .filter((tag) => !existentTagsTitles.includes(tag))
      .map((tag) => ({ title: tag }));

    return newTags;
  }

  private mapTagsById(tags: any[]) {
    const mappedTags = tags.map((tag: any) => tag._id);
    return mappedTags;
  }

  private createContact(email: string) {
    Contact.create({
      email,
      tags: this.tagsIds,
    });
  }
}
export default ImportContactsService;

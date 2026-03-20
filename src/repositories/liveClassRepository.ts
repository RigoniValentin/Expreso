import LiveClass, { ILiveClass } from "../models/LiveClass";

export class LiveClassRepository {
  async create(liveClassData: Partial<ILiveClass>): Promise<ILiveClass> {
    const liveClass = new LiveClass(liveClassData);
    return await liveClass.save();
  }

  async findById(id: string): Promise<ILiveClass | null> {
    return await LiveClass.findById(id).populate(
      "registeredUsers",
      "name email"
    );
  }

  async findAll(filters: any = {}): Promise<ILiveClass[]> {
    return await LiveClass.find(filters).sort({ scheduledDate: 1 });
  }

  async findUpcoming(): Promise<ILiveClass[]> {
    return await LiveClass.find({
      scheduledDate: { $gte: new Date() },
    }).sort({ scheduledDate: 1 });
  }

  async findByArea(area: string): Promise<ILiveClass[]> {
    return await LiveClass.find({
      area,
      scheduledDate: { $gte: new Date() },
    }).sort({ scheduledDate: 1 });
  }

  async findLive(): Promise<ILiveClass[]> {
    return await LiveClass.find({ isLive: true }).sort({ scheduledDate: 1 });
  }

  async findPast(): Promise<ILiveClass[]> {
    return await LiveClass.find({
      scheduledDate: { $lt: new Date() },
      recordingUrl: { $exists: true, $ne: null },
    }).sort({ scheduledDate: -1 });
  }

  async update(
    id: string,
    updateData: Partial<ILiveClass>
  ): Promise<ILiveClass | null> {
    return await LiveClass.findByIdAndUpdate(id, updateData, { new: true });
  }

  async registerUser(
    liveClassId: string,
    userId: string
  ): Promise<ILiveClass | null> {
    return await LiveClass.findByIdAndUpdate(
      liveClassId,
      { $addToSet: { registeredUsers: userId } },
      { new: true }
    );
  }

  async unregisterUser(
    liveClassId: string,
    userId: string
  ): Promise<ILiveClass | null> {
    return await LiveClass.findByIdAndUpdate(
      liveClassId,
      { $pull: { registeredUsers: userId } },
      { new: true }
    );
  }

  async isUserRegistered(
    liveClassId: string,
    userId: string
  ): Promise<boolean> {
    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) return false;
    return liveClass.registeredUsers.some((id) => id.toString() === userId);
  }

  async setLive(id: string, isLive: boolean): Promise<ILiveClass | null> {
    return await LiveClass.findByIdAndUpdate(id, { isLive }, { new: true });
  }

  async addRecording(
    id: string,
    recordingUrl: string
  ): Promise<ILiveClass | null> {
    return await LiveClass.findByIdAndUpdate(
      id,
      { recordingUrl, isLive: false },
      { new: true }
    );
  }

  async delete(id: string): Promise<ILiveClass | null> {
    return await LiveClass.findByIdAndDelete(id);
  }

  async getUpcomingByUser(userId: string): Promise<ILiveClass[]> {
    return await LiveClass.find({
      registeredUsers: userId,
      scheduledDate: { $gte: new Date() },
    }).sort({ scheduledDate: 1 });
  }
}

export default new LiveClassRepository();

import liveClassRepository from "../repositories/liveClassRepository";
import { ILiveClassCreate, ILiveClassUpdate } from "../types/NehilakTypes";

export class LiveClassService {
  async createLiveClass(data: ILiveClassCreate) {
    return await liveClassRepository.create(data);
  }

  async getLiveClassById(id: string) {
    const liveClass = await liveClassRepository.findById(id);
    if (!liveClass) {
      throw new Error("Clase en vivo no encontrada");
    }
    return liveClass;
  }

  async getAllLiveClasses() {
    return await liveClassRepository.findAll();
  }

  async getUpcomingClasses() {
    return await liveClassRepository.findUpcoming();
  }

  async getUpcomingClassesByArea(area: string) {
    return await liveClassRepository.findByArea(area);
  }

  async getLiveClasses() {
    return await liveClassRepository.findLive();
  }

  async getPastClassesWithRecordings() {
    return await liveClassRepository.findPast();
  }

  async updateLiveClass(id: string, data: ILiveClassUpdate) {
    return await liveClassRepository.update(id, data);
  }

  async deleteLiveClass(id: string) {
    return await liveClassRepository.delete(id);
  }

  async registerUserForClass(liveClassId: string, userId: string) {
    const liveClass = await liveClassRepository.findById(liveClassId);
    if (!liveClass) {
      throw new Error("Clase en vivo no encontrada");
    }

    // Verificar límite de participantes
    if (
      liveClass.maxParticipants &&
      liveClass.registeredUsers.length >= liveClass.maxParticipants
    ) {
      throw new Error("La clase ha alcanzado el máximo de participantes");
    }

    // Verificar que no esté registrado ya
    const isRegistered = await liveClassRepository.isUserRegistered(
      liveClassId,
      userId
    );
    if (isRegistered) {
      throw new Error("El usuario ya está registrado para esta clase");
    }

    return await liveClassRepository.registerUser(liveClassId, userId);
  }

  async unregisterUserFromClass(liveClassId: string, userId: string) {
    const isRegistered = await liveClassRepository.isUserRegistered(
      liveClassId,
      userId
    );
    if (!isRegistered) {
      throw new Error("El usuario no está registrado para esta clase");
    }

    return await liveClassRepository.unregisterUser(liveClassId, userId);
  }

  async startLiveClass(id: string) {
    return await liveClassRepository.setLive(id, true);
  }

  async endLiveClass(id: string) {
    return await liveClassRepository.setLive(id, false);
  }

  async addRecording(id: string, recordingUrl: string) {
    return await liveClassRepository.addRecording(id, recordingUrl);
  }

  async getUserUpcomingClasses(userId: string) {
    return await liveClassRepository.getUpcomingByUser(userId);
  }

  async getLiveClassWithUserStatus(liveClassId: string, userId: string) {
    const liveClass = await liveClassRepository.findById(liveClassId);
    if (!liveClass) {
      throw new Error("Clase en vivo no encontrada");
    }

    const isRegistered = await liveClassRepository.isUserRegistered(
      liveClassId,
      userId
    );

    return {
      ...liveClass.toObject(),
      isRegistered,
      participantsCount: liveClass.registeredUsers.length,
    };
  }
}

export default new LiveClassService();

import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  const mockPassword = '123456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password', async () => {
    expect(await service.hash(mockPassword)).not.toBe(mockPassword);
  });

  it('should compare passwords and return true', async () => {
    const hashedPassword = await service.hash(mockPassword);
    expect(await service.compare(mockPassword, hashedPassword)).toBeTruthy();
  });

  it('should compare passwords and return false', async () => {
    const hashedPassword = await service.hash(mockPassword);
    expect(await service.compare('randomtext', hashedPassword)).toBeFalsy();
  });
});

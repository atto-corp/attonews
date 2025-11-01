import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../services/service-container';
import { registerRequestSchema } from '../../models/schemas';

export const POST = async (request: NextRequest) => {
  const body = await request.json();

  // Validate request body
  const validationResult = registerRequestSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: 'Invalid request data', errors: validationResult.error.errors },
      { status: 400 }
    );
  }

  const { email, password } = validationResult.data;

  const container = ServiceContainer.getInstance();
  const authService = await container.getAuthService();

  // Register user
  const user = await authService.registerUser(email, password);

  // Generate tokens for immediate login
  const tokens = authService.generateTokens(user);

  // Return success response
  return NextResponse.json(
    {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      tokens
    },
    { status: 201 }
  );
};

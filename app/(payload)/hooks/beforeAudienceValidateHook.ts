import { Resend } from 'resend';
import { APIError, CollectionBeforeValidateHook } from 'payload';
import { STATUS_CODES } from '@/app/contsants/constants';

export const beforeAudienceValidateHook: CollectionBeforeValidateHook = async ({
  data,
  operation,
}) => {
  if (operation !== 'create') {
    return data;
  }

  if (typeof data?.name !== 'string') {
    throw new APIError(
      'beforeAudienceValidateHook: Missing data - name',
      STATUS_CODES.BadRequest
    );
  }

  const { name } = data;
  try {
    const resend = new Resend(process.env.RESEND_FULL_API_KEY || '');
    const resp = await resend.audiences.create({ name });

    if (resp.error || !resp.data) {
      throw new APIError(
        resp.error?.message ?? 'RESEND: An Unknown Error Occurred',
        STATUS_CODES.ServiceUnavailable
      );
    }

    return { ...data, resendId: resp.data.id };
  } catch (err) {
    let errMessage = 'An Unknown Error Occurred';
    if (err instanceof Error) {
      errMessage = err.message;
    }
    throw new APIError(errMessage, STATUS_CODES.InternalServerError);
  }
};

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        String(2),
        unique=True,
        nullable=False,
        index=True,
    )

    cities = relationship(
        "City",
        back_populates="country",
    )